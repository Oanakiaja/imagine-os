import { spawn, type ChildProcess, execSync } from 'node:child_process';
import type { AgentMessage } from '@imagine/shared';

export interface ClaudeCodeOptions {
  timeout?: number; // 默认 60 秒
  workingDir?: string;
}

const get_claude_code = () => {
  // manuel setting
  if (process.env.CLAUDE_CLI_BIN) {
    console.log('use preset');
    return process.env.CLAUDE_CLI_BIN;
  }
  // use which claude to set
  try {
    console.log('use autofind claude');
    const claudePath = execSync('which claude', { encoding: 'utf8' }).trim();
    if (claudePath) {
      return claudePath;
    }
  } catch {
    // which 命令失败，继续使用默认值
    return 'claude';
  }
  return 'claude';
};

/**
 * 通过子进程调用 Claude Code CLI
 * 参考: https://github.com/joshbickett/generative-computer
 */
export async function* invokeClaudeCode(
  prompt: string,
  systemPrompt: string,
  options: ClaudeCodeOptions = {}
): AsyncGenerator<AgentMessage> {
  const { timeout = 60000, workingDir = process.cwd() } = options;

  let claudeProcess: ChildProcess | null = null;
  let timeoutId: NodeJS.Timeout | null = null;
  let isTimedOut = false;

  try {
    // 生成消息: 开始处理
    yield {
      type: 'text',
      data: 'Starting Claude Code agent...',
      timestamp: Date.now(),
    };

    // 构建 Claude CLI 参数
    const args = [
      '-p',
      '--dangerously-skip-permissions',
      '--append-system-prompt',
      systemPrompt,
      prompt,
    ];

    // 启动 Claude Code 子进程
    claudeProcess = spawn(get_claude_code(), args, {
      cwd: workingDir,
      env: {
        ...process.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // 设置超时
    timeoutId = setTimeout(() => {
      isTimedOut = true;
      if (claudeProcess && !claudeProcess.killed) {
        claudeProcess.kill('SIGTERM');
        setTimeout(() => {
          if (claudeProcess && !claudeProcess.killed) {
            claudeProcess.kill('SIGKILL');
          }
        }, 5000);
      }
    }, timeout);

    let stdoutBuffer = '';
    let stderrBuffer = '';
    const outputQueue: string[] = [];
    let outputResolve: ((value: string | null) => void) | null = null;

    // 处理 stdout - 使用队列实现流式输出
    if (claudeProcess.stdout) {
      claudeProcess.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf-8');
        console.log('claude output:', text);
        stdoutBuffer += text;

        // 将输出放入队列
        outputQueue.push(text);
        if (outputResolve) {
          outputResolve(outputQueue.shift() || null);
          outputResolve = null;
        }
      });
    }

    // 处理 stderr
    if (claudeProcess.stderr) {
      claudeProcess.stderr.on('data', (chunk: Buffer) => {
        console.log('claude error:', chunk.toString('utf-8'));
        stderrBuffer += chunk.toString('utf-8');
        console.error('[Claude Code stderr]:', chunk.toString('utf-8'));
      });
    }

    // 创建异步迭代器来流式输出
    const getNextOutput = (): Promise<string | null> => {
      console.log('claude output queue:', outputQueue);
      if (outputQueue.length > 0) {
        return Promise.resolve(outputQueue.shift() || null);
      }
      return new Promise((resolve) => {
        outputResolve = resolve;
      });
    };

    // 等待进程结束的 Promise
    const exitPromise = new Promise<number>((resolve, reject) => {
      if (!claudeProcess) {
        reject(new Error('Process not started'));
        return;
      }

      claudeProcess.on('close', (code) => {
        // 进程关闭时，通知队列结束
        if (outputResolve) {
          outputResolve(null);
          outputResolve = null;
        }
        resolve(code ?? 1);
      });

      claudeProcess.on('error', (error) => {
        if (outputResolve) {
          outputResolve(null);
          outputResolve = null;
        }
        reject(error);
      });
    });

    // 流式输出直到进程结束
    let processEnded = false;
    exitPromise
      .then(() => {
        processEnded = true;
        if (outputResolve) {
          outputResolve(null);
        }
      })
      .catch(() => {
        processEnded = true;
        if (outputResolve) {
          outputResolve(null);
        }
      });

    // 持续读取输出
    while (!processEnded || outputQueue.length > 0) {
      const text = await getNextOutput();
      if (text === null && processEnded) {
        break;
      }
      if (text) {
        yield {
          type: 'text',
          data: text,
          timestamp: Date.now(),
        };
      }
    }

    // 等待进程完全结束
    const exitCode = await exitPromise;

    // 清除超时
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 处理结果
    if (isTimedOut) {
      yield {
        type: 'error',
        data: `Claude Code process timed out after ${timeout}ms`,
        timestamp: Date.now(),
      };
    } else if (exitCode !== 0) {
      yield {
        type: 'error',
        data: `Claude Code exited with code ${exitCode}${stderrBuffer ? `: ${stderrBuffer}` : ''}`,
        timestamp: Date.now(),
      };
    } else {
      // 成功完成
      yield {
        type: 'complete',
        data: stdoutBuffer,
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    // 清除超时
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 终止进程
    if (claudeProcess && !claudeProcess.killed) {
      claudeProcess.kill('SIGTERM');
    }

    yield {
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}
