import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitConfig {
  failureThreshold: number;
  successThreshold: number;
  openTimeoutMs: number;
  rollingWindowMs: number;
}

interface CircuitStats {
  failures: number[];
  successes: number[];
  state: CircuitState;
  nextAttemptAt: number;
}

@Injectable()
export class CircuitBreakerService {
  private circuits: Map<string, CircuitStats> = new Map();

  private readonly defaultConfig: CircuitConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    openTimeoutMs: 15_000,
    rollingWindowMs: 60_000,
  };

  constructor(private logger: LoggerService) {}

  async execute<T>(
    key: string,
    action: () => Promise<T>,
    config?: Partial<CircuitConfig>,
  ): Promise<T> {
    const cfg = { ...this.defaultConfig, ...config };
    const circuit = this.getCircuit(key, cfg);
    const now = Date.now();

    if (circuit.state === 'OPEN') {
      if (now < circuit.nextAttemptAt) {
        this.logger.warn(`Circuit ${key} open. Blocking request.`);
        throw new Error(`Circuit ${key} is open. Try again later.`);
      }
      circuit.state = 'HALF_OPEN';
    }

    try {
      const result = await action();
      this.recordSuccess(circuit, cfg);
      return result;
    } catch (error: any) {
      this.recordFailure(circuit, cfg, key);
      throw error;
    }
  }

  private getCircuit(key: string, cfg: CircuitConfig): CircuitStats {
    const existing = this.circuits.get(key);
    if (existing) {
      this.pruneStats(existing, cfg);
      return existing;
    }

    const stats: CircuitStats = {
      failures: [],
      successes: [],
      state: 'CLOSED',
      nextAttemptAt: 0,
    };
    this.circuits.set(key, stats);
    return stats;
  }

  private recordFailure(
    circuit: CircuitStats,
    cfg: CircuitConfig,
    key: string,
  ): void {
    const now = Date.now();
    circuit.failures.push(now);
    this.pruneStats(circuit, cfg);

    if (circuit.state === 'HALF_OPEN') {
      circuit.state = 'OPEN';
      circuit.nextAttemptAt = now + cfg.openTimeoutMs;
      circuit.successes = [];
      this.logger.error(`Circuit ${key} reopened after half-open failure`);
      return;
    }

    if (
      circuit.failures.length >= cfg.failureThreshold &&
      circuit.state === 'CLOSED'
    ) {
      circuit.state = 'OPEN';
      circuit.nextAttemptAt = now + cfg.openTimeoutMs;
      this.logger.error(
        `Circuit ${key} opened after ${circuit.failures.length} failures`,
      );
    }
  }

  private recordSuccess(circuit: CircuitStats, cfg: CircuitConfig): void {
    const now = Date.now();
    circuit.successes.push(now);
    this.pruneStats(circuit, cfg);

    if (circuit.state === 'HALF_OPEN') {
      if (circuit.successes.length >= cfg.successThreshold) {
        circuit.state = 'CLOSED';
        circuit.failures = [];
        circuit.successes = [];
      }
    } else if (circuit.state === 'OPEN') {
      circuit.state = 'HALF_OPEN';
      circuit.successes = [now];
    }
  }

  private pruneStats(circuit: CircuitStats, cfg: CircuitConfig): void {
    const cutoff = Date.now() - cfg.rollingWindowMs;
    circuit.failures = circuit.failures.filter((ts) => ts >= cutoff);
    circuit.successes = circuit.successes.filter((ts) => ts >= cutoff);
  }
}
