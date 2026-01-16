#!/usr/bin/env node
const autocannon = require('autocannon');

class LoadTest {
  constructor({
    host,
    email,
    password,
    duration = 30,
    connections = 10,
    pipelining = 1,
    timeout = 10,
  }) {
    this.host = host || '';
    this.email = email || '';
    this.password = password || '';
    this.duration = duration;
    this.connections = connections;
    this.pipelining = pipelining;
    this.timeout = timeout;
  }

  validate() {
    if (!this.host || !this.email || !this.password) {
      console.error(
        'Missing host, email or password. Set them before running.',
      );
      process.exit(1);
    }
  }

  run() {
    this.validate();

    const url = `${this.host}/test/auth/login`;

    const instance = autocannon({
      url,
      method: 'POST',
      duration: this.duration,
      connections: this.connections,
      pipelining: this.pipelining,
      timeout: this.timeout,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true,
    });

    instance.on('tick', () => {});

    instance.on('done', (result) => {
      console.log('Load test finished:');
      console.log({
        latency: result.latency,
        throughput: result.throughput,
        requests: result.requests,
        errors: result.errors,
      });
    });
  }
}

const test = new LoadTest({
  host: '',
  email: '',
  password: '',
});

test.run();
