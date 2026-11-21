// Archived feature module. This file is intentionally not loaded by index.html.
export class JerkTelemetry {
  constructor() {
    this.previousAcceleration = 0;
    this.previousAccelerationTime = performance.now();
    this.currentJerk = 0;
    this.recentJerks = [];
    this.logs = [];
  }

  updateAcceleration(accelerationMs2) {
    const now = performance.now();
    const dt = (now - this.previousAccelerationTime) / 1000;
    if (dt > 0.01) {
      this.currentJerk = Math.abs((accelerationMs2 - this.previousAcceleration) / dt);
      this.recentJerks.push({ time: now, jerk: this.currentJerk });
      this.recentJerks = this.recentJerks.filter(item => now - item.time < 600);
    }
    this.previousAcceleration = accelerationMs2;
    this.previousAccelerationTime = now;
  }

  recordShiftDown({ fromGear, toGear, speedKmh, gearRatios, peakRpmDuringClutch, engagedRpm }) {
    const idealRpm = Math.round(speedKmh * gearRatios[toGear - 1]);
    const blipRpm = peakRpmDuringClutch > 0 ? peakRpmDuringClutch : engagedRpm;
    const rpmError = blipRpm - idealRpm;
    const maxJerkMs3 = this.recentJerks.reduce((max, item) => Math.max(max, item.jerk), 0);
    const score = Math.max(0, Math.min(100, Math.round(100 - Math.abs(rpmError) * 0.06 - maxJerkMs3 * 2)));
    const log = {
      timestamp: new Date().toLocaleTimeString(),
      shift: `${fromGear} -> ${toGear}`,
      speedKmh: Math.round(speedKmh),
      idealRpm,
      actualBlipRpm: blipRpm,
      rpmError,
      maxJerkMs3: Number(maxJerkMs3.toFixed(2)),
      score
    };
    this.logs.unshift(log);
    return log;
  }

  createAnalysisPrompt(vehicleName) {
    return `以下は私の愛車（${vehicleName}）でのMTシフトダウン（ヒール＆トゥ／回転合わせ）のテレメトリログです。
回転数誤差（rpmError）とシフトショックの指標である躍度（maxJerkMs3）の相関を分析し、専属レーシングエンジニアの視点でドライビングの癖と改善アドバイスをください。

${JSON.stringify(this.logs, null, 2)}`;
  }

  renderLogs(container) {
    container.replaceChildren();
    if (this.logs.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'シフトダウン完了時に精度とジャークを自動記録します';
      container.appendChild(empty);
      return;
    }

    for (const log of this.logs) {
      const item = document.createElement('div');
      const details = document.createElement('span');
      const score = document.createElement('strong');
      item.className = 'log-item';
      details.textContent = `${log.shift}速 (${log.speedKmh}km/h) 誤差: ${log.rpmError >= 0 ? '+' : ''}${log.rpmError}rpm / Jerk: ${log.maxJerkMs3}`;
      score.className = 'score-badge';
      score.textContent = `${log.score}点`;
      item.append(details, score);
      container.appendChild(item);
    }
  }
}
