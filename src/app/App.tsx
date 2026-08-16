import { useState } from "react";
import { BookOpen, CircleHelp, RadioTower, Sparkles } from "lucide-react";
import { OperatorStation } from "../features/teleoperation/components/OperatorStation";
import { ExcavatorScene } from "../features/teleoperation/components/ExcavatorScene";
import { NetworkPanel } from "../features/teleoperation/components/NetworkPanel";
import { PacketFlow } from "../features/teleoperation/components/PacketFlow";
import { TelemetryBar } from "../features/teleoperation/components/TelemetryBar";
import { FeedbackLoop } from "../features/teleoperation/components/FeedbackLoop";
import { CommandTimeline } from "../features/teleoperation/components/CommandTimeline";
import { SafetyPanel } from "../features/teleoperation/components/SafetyPanel";
import { ExplanationPanel } from "../features/teleoperation/components/ExplanationPanel";
import { EventLog } from "../features/teleoperation/components/EventLog";
import { LearningLab } from "../features/teleoperation/components/LearningLab";
import { WhyDrawer } from "../features/teleoperation/components/WhyDrawer";
import { useTeleoperationSimulation } from "../features/teleoperation/hooks/useTeleoperationSimulation";

export function App() {
  const { snapshot, command, setNetwork, setMode, setTarget, setRejectStale, emergencyStop, safetyConfig } = useTeleoperationSimulation();
  const [deep, setDeep] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const rejectStale = safetyConfig.rejectStaleCommands;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Signal Yard home"><span><RadioTower /></span><div><strong>SIGNAL YARD</strong><small>Teleoperation Network Simulator</small></div></a>
        <div className="header-actions">
          <label className="deep-toggle"><input type="checkbox" checked={deep} onChange={(event) => setDeep(event.target.checked)} /><span><Sparkles size={14} /> Go deeper</span></label>
          <button className="why-button" onClick={() => setWhyOpen(true)}><CircleHelp size={17} /> Why?</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div><span className="hero-kicker"><i /> LIVE LEARNING LAB · MODULE 01</span><h1>Drive the machine.<br /><em>Change the network.</em></h1></div>
          <p>Send a command, watch it travel, and see why remote control depends on the full feedback loop—not just a fast connection.</p>
        </section>

        <TelemetryBar snapshot={snapshot} />

        <section className="simulator-grid">
          <OperatorStation activeCommand={snapshot.requestedCommand} mode={snapshot.mode} safetyState={snapshot.safety.state} onCommand={command} onMode={setMode} onEmergencyStop={emergencyStop} />
          <ExcavatorScene machine={snapshot.machine} operatorView={snapshot.operatorView} mode={snapshot.mode} quality={snapshot.feedbackQuality} onTarget={setTarget} />
          <NetworkPanel network={snapshot.network} rejectStale={rejectStale} onChange={setNetwork} onRejectStale={setRejectStale} onMode={setMode} />
        </section>

        <PacketFlow packets={snapshot.packets} now={snapshot.now} connected={snapshot.network.connected} />
        <ExplanationPanel snapshot={snapshot} deep={deep} />

        <section className="detail-grid">
          <FeedbackLoop timing={snapshot.loopTiming} />
          <SafetyPanel safety={snapshot.safety} config={safetyConfig} />
          <CommandTimeline commands={snapshot.commands} />
          <EventLog events={snapshot.events} />
        </section>

        <section className="learn-section">
          <div className="section-intro"><span><BookOpen /></span><div><span className="eyebrow">MAKE THE CALL</span><h2>Turn the behavior into engineering judgment</h2><p>Short scenarios help you explain why the design works this way.</p></div></div>
          <LearningLab />
        </section>
      </main>

      <footer><strong>SIGNAL YARD · MODULE 01</strong><p>An educational simulation. It does not represent TerraFirma's private architecture or real construction equipment safety rules.</p></footer>
      <button className="floating-why" onClick={() => setWhyOpen(true)}><CircleHelp /> <span>Why?</span></button>
      <WhyDrawer open={whyOpen} onClose={() => setWhyOpen(false)} />
    </div>
  );
}
