import { useState } from "react";
import { BookOpen, CircleHelp, RadioTower } from "lucide-react";
import { LearningLab } from "../features/teleoperation/components/LearningLab";
import { WhyDrawer } from "../features/teleoperation/components/WhyDrawer";
import { GuidedLearning } from "../features/teleoperation/components/GuidedLearning";
import { FocusedLabWorkspace } from "../features/teleoperation/components/FocusedLabWorkspace";
import { useTeleoperationSimulation } from "../features/teleoperation/hooks/useTeleoperationSimulation";
import { guidedLabs, type GuidedLabDefinition } from "../features/teleoperation/learning/guidedLabs";

export function App() {
  const { snapshot, command, setNetwork, setMode, setTarget, setRejectStale, safetyConfig } = useTeleoperationSimulation();
  const [whyOpen, setWhyOpen] = useState(false);
  const [activeLabIndex, setActiveLabIndex] = useState(0);
  const rejectStale = safetyConfig.rejectStaleCommands;
  const activeLab = guidedLabs[activeLabIndex] ?? guidedLabs[0];

  const loadLabSetup = (lab: GuidedLabDefinition) => {
    setNetwork(lab.setup.network);
    setMode(lab.setup.mode);
    setRejectStale(lab.setup.rejectStaleCommands);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Signal Yard home"><span><RadioTower /></span><div><strong>SIGNAL YARD</strong><small>Teleoperation Network Simulator</small></div></a>
        <div className="header-actions">
          <button className="why-button" onClick={() => setWhyOpen(true)}><CircleHelp size={17} /> Why?</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div><span className="hero-kicker"><i /> LIVE LEARNING LAB · MODULE 01</span><h1>Drive the machine.<br /><em>Change the network.</em></h1></div>
          <p>Send a command, watch it travel, and see why remote control depends on the full feedback loop—not just a fast connection.</p>
        </section>

        <GuidedLearning snapshot={snapshot} activeLabIndex={activeLabIndex} onChangeLab={setActiveLabIndex} onLoadSetup={loadLabSetup} />
        <FocusedLabWorkspace lab={activeLab} snapshot={snapshot} safetyConfig={safetyConfig} rejectStale={rejectStale} onCommand={command} onNetworkChange={setNetwork} onMode={setMode} onRejectStale={setRejectStale} onTarget={setTarget} />

        <details className="review-details">
          <summary><span><BookOpen /><strong>Check what you learned</strong></span><span className="details-action">Open review</span></summary>
          <section className="learn-section">
            <div className="section-intro"><span><BookOpen /></span><div><span className="eyebrow">MAKE THE CALL</span><h2>Turn the behavior into engineering judgment</h2><p>Short scenarios help you explain why the design works this way.</p></div></div>
            <LearningLab />
          </section>
        </details>
      </main>

      <footer><strong>SIGNAL YARD · MODULE 01</strong><p>An educational simulation. It does not represent TerraFirma's private architecture or real construction equipment safety rules.</p></footer>
      <button className="floating-why" onClick={() => setWhyOpen(true)}><CircleHelp /> <span>Why?</span></button>
      <WhyDrawer open={whyOpen} onClose={() => setWhyOpen(false)} />
    </div>
  );
}
