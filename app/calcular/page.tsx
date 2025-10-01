"use client";

import React from "react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { loadRetoTargets, loadHoursPerModule, saveRetoTargets } from "@/lib/services/configService";
import { getCalculations, type CalculateResponse } from "@/lib/services/apiClient";

type Mode = "horas" | "dias";


function sumRecordValuesExcludingJ(record: Record<string, number> | undefined): number {
	if (!record) return 0;
	return Object.entries(record).reduce((acc, [code, n]) => {
		if (code === "J") return acc; // Justificadas no cuentan
		return acc + (Number.isFinite(n) ? (n as number) : 0);
	}, 0);
}

export default function CalcularPage() {
	const { snapshot, loading } = useSnapshot();
	const [mode, setMode] = React.useState<Mode>("horas");
	const [amount, setAmount] = React.useState<number>(0);
	const [selectedModule, setSelectedModule] = React.useState<string>("__general__");
	const [calculations, setCalculations] = React.useState<CalculateResponse | null>(null);
	const [calculationsLoading, setCalculationsLoading] = React.useState(false);

	// ---- CONFIGURACIÓN ----
	type ModuleId = string;
	type RetoId = string;

	const [retoTargets, setRetoTargets] = React.useState<Record<RetoId, Record<ModuleId, boolean>>>({});
	const [hoursPerModule, setHoursPerModule] = React.useState<Record<ModuleId, number>>({});

	// Cargar/salvar selección de módulos por reto
	React.useEffect(() => {
		const loadConfig = async () => {
			const [targets, hours] = await Promise.all([
				loadRetoTargets(),
				loadHoursPerModule()
			]);
			setRetoTargets(targets);
			setHoursPerModule(hours);
		};
		loadConfig();
	}, []);

	const saveRetoTargetsCallback = React.useCallback(async (next: Record<RetoId, Record<ModuleId, boolean>>) => {
		setRetoTargets(next);
		await saveRetoTargets(next);
	}, []);

	const HOURS_PER_DAY = 6;

	const addedAbsences = React.useMemo(() => {
		const units = Number.isFinite(amount) && amount > 0 ? amount : 0;
		return mode === "horas" ? units : units * HOURS_PER_DAY;
	}, [mode, amount]);

	// Cargar cálculos cuando cambien los parámetros
	React.useEffect(() => {
		if (!snapshot?.identity?.dni) return;
		
		const loadCalculations = async () => {
			setCalculationsLoading(true);
			try {
				const result = await getCalculations(
					snapshot.identity.dni,
					selectedModule,
					addedAbsences
				);
				setCalculations(result);
			} catch (error) {
				console.error("Error loading calculations:", error);
			} finally {
				setCalculationsLoading(false);
			}
		};

		loadCalculations();
	}, [snapshot?.identity?.dni, selectedModule, addedAbsences]);

	// Obtener módulos disponibles
	const moduleKeys = React.useMemo(() => {
		return calculations?.moduleMeta?.map(m => m.code) || [];
	}, [calculations]);

	// Obtener retos disponibles
	const retosAuto = React.useMemo(() => {
		return calculations?.moduleMeta?.filter(m => m.isReto) || [];
	}, [calculations]);

	// Verificar si el módulo seleccionado es un reto
	const selectedIsReto = React.useMemo(() => {
		if (!calculations || selectedModule === "__general__") return false;
		const module = calculations.moduleMeta.find(m => m.code === selectedModule);
		return module?.isReto || false;
	}, [calculations, selectedModule]);

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold tracking-tight">Calcular</h1>
			{!snapshot ? (
				<div className="text-muted-foreground">
					{loading ? "Cargando datos..." : "Sin datos. Ve a Vista general y sincroniza."}
				</div>
			) : (
				<>
					<div className="rounded-md border bg-amber-50 text-amber-900 px-3 py-2 text-sm">
						Aviso: esta herramienta ofrece estimaciones que pueden no corresponder con la realidad. No nos hacemos responsables del uso de estos cálculos.
					</div>
					<Card>
						<CardHeader>
							<CardTitle>General</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div className="space-y-1">
									<Label htmlFor="mode-general">Unidad</Label>
									<Select id="mode-general" value={mode} onChange={(e) => setMode((e.target.value as Mode) || "horas")}>
										<option value="horas">Horas</option>
										<option value="dias">Días</option>
									</Select>
								</div>
								<div className="space-y-1">
									<Label htmlFor="amount-general">Cantidad</Label>
									<Input id="amount-general" type="number" min={0} step={1} value={Number.isFinite(amount) ? amount : 0} onChange={(e) => setAmount(Number(e.target.value))} />
								</div>
								<div className="space-y-1">
									<Label>Total sesiones</Label>
									<div className="h-10 flex items-center">
										{calculationsLoading ? "..." : calculations?.general.totalSessions || 0}
										{mode === "dias" ? <span className="ml-2 text-muted-foreground">(1 día = {HOURS_PER_DAY} h)</span> : null}
									</div>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="rounded bg-muted px-3 py-2">
									<span className="text-muted-foreground">Actual</span>
									<div className="text-xl font-semibold">
										{calculationsLoading ? "..." : calculations?.general.currentPercent || 0}%
									</div>
								</div>
								<div className="rounded bg-muted px-3 py-2">
									<span className="text-muted-foreground">Con estas faltas</span>
									<div className="text-xl font-semibold">
										{calculationsLoading ? "..." : calculations?.general.projectedPercent || 0}%
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Por módulo</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div className="space-y-1">
									<Label htmlFor="module-select">Módulo</Label>
									<Select id="module-select" value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
										<option value="__general__" disabled>Selecciona módulo</option>
										{moduleKeys.map((m) => (
											<option key={m} value={m}>
												{calculations?.moduleMeta.find(meta => meta.code === m)?.label || m}
											</option>
										))}
									</Select>
								</div>
								<div className="space-y-1">
									<Label htmlFor="mode-module">Unidad</Label>
									<Select id="mode-module" value={mode} onChange={(e) => setMode((e.target.value as Mode) || "horas")}>
										<option value="horas">Horas</option>
										<option value="dias">Días</option>
									</Select>
								</div>
								<div className="space-y-1">
									<Label htmlFor="amount-module">Cantidad</Label>
									<Input id="amount-module" type="number" min={0} step={1} value={Number.isFinite(amount) ? amount : 0} onChange={(e) => setAmount(Number(e.target.value))} />
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="rounded bg-muted px-3 py-2">
									<span className="text-muted-foreground">Actual</span>
									<div className="text-xl font-semibold">
										{calculationsLoading ? "..." : calculations?.module.currentPercent || 0}%
									</div>
								</div>
								<div className="rounded bg-muted px-3 py-2">
									<span className="text-muted-foreground">Con estas faltas</span>
									<div className="text-xl font-semibold">
										{calculationsLoading ? "..." : calculations?.module.projectedPercent || 0}%
									</div>
								</div>
							</div>

							{/* Si el seleccionado es un reto: mostrar % del reto y de sus módulos */}
							{selectedIsReto && calculations?.retoAnalysis ? (
								<div className="border rounded p-3 space-y-3">
									<div className="font-medium">Detalle del reto y sus módulos</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="rounded bg-muted px-3 py-2">
											<span className="text-muted-foreground">Reto · Actual</span>
											<div className="text-xl font-semibold">{calculations.retoAnalysis.reto.current}%</div>
										</div>
										<div className="rounded bg-muted px-3 py-2">
											<span className="text-muted-foreground">Reto · Con estas faltas</span>
											<div className="text-xl font-semibold">{calculations.retoAnalysis.reto.projected}%</div>
										</div>
									</div>
									<div className="overflow-auto">
										<table className="w-full text-sm">
											<thead>
												<tr>
													<th className="text-left p-1">Módulo</th>
													<th className="text-left p-1">Actual</th>
													<th className="text-left p-1">Con estas faltas</th>
												</tr>
											</thead>
											<tbody>
												{calculations.retoAnalysis.modules.map((row) => (
													<tr key={`reto-row-${row.code}`} className="border-t">
														<td className="p-1 whitespace-nowrap">{row.label}</td>
														<td className="p-1">{row.current.toFixed(2)}%</td>
														<td className="p-1">{row.projected.toFixed(2)}%</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							) : null}
						</CardContent>
					</Card>		
				</>
			)}
		</div>
	);
}
