import { useCallback, useEffect, useRef, useState } from "react";
import { TeleoperationSimulation } from "../simulation/teleoperationSimulation";
import type { CommandType, ControlMode, NetworkCondition, SimulationSnapshot } from "../types";

export function useTeleoperationSimulation() {
  const simulation = useRef<TeleoperationSimulation | null>(null);
  if (!simulation.current) simulation.current = new TeleoperationSimulation();
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => simulation.current!.getSnapshot());

  useEffect(() => {
    const timer = window.setInterval(() => setSnapshot(simulation.current!.tick(Date.now())), 50);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = useCallback(() => setSnapshot(simulation.current!.getSnapshot()), []);
  const command = useCallback((type: CommandType) => { simulation.current!.issueCommand(type); refresh(); }, [refresh]);
  const setNetwork = useCallback((change: Partial<NetworkCondition>) => { simulation.current!.setNetwork(change); refresh(); }, [refresh]);
  const setMode = useCallback((mode: ControlMode) => { simulation.current!.setMode(mode); refresh(); }, [refresh]);
  const setTarget = useCallback((x: number, y: number) => { simulation.current!.setTarget(x, y); refresh(); }, [refresh]);
  const setRejectStale = useCallback((enabled: boolean) => { simulation.current!.setRejectStaleCommands(enabled); refresh(); }, [refresh]);
  const emergencyStop = useCallback((active: boolean) => { simulation.current!.setEmergencyStop(active); refresh(); }, [refresh]);

  return { snapshot, command, setNetwork, setMode, setTarget, setRejectStale, emergencyStop, safetyConfig: simulation.current.getSafetyConfig() };
}
