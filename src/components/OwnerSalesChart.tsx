import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ArrowRight, Maximize2, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchPurchaseSeries } from "@/lib/loyalty.queries";
import {
  businessDate,
  dailySales,
  formatMoney,
  monthlySales,
  shiftDate,
  weekStart,
  type SalesBucket,
} from "@/lib/purchase-analytics";

function SalesPlot({ buckets }: { buckets: SalesBucket[] }) {
  return (
    <>
      <div className="sales-chart-totals">
        <div>
          <span>Compras registradas</span>
          <strong>{buckets.reduce((sum, bucket) => sum + bucket.purchases, 0)}</strong>
        </div>
        <div>
          <span>Ingresos registrados</span>
          <strong>{formatMoney(buckets.reduce((sum, bucket) => sum + bucket.income, 0))}</strong>
        </div>
      </div>
      <div
        className="sales-plot"
        role="img"
        aria-label="Gráfica de compras e ingresos. Los valores exactos están disponibles en la tabla de datos."
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={buckets}
            margin={{ top: 15, right: 5, left: 0, bottom: 5 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              yAxisId="count"
              allowDecimals={false}
              width={35}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="income"
              orientation="right"
              width={65}
              tickFormatter={(value) =>
                `$${Number(value).toLocaleString("es-MX", { notation: "compact" })}`
              }
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
              formatter={(value, name) => [
                name === "Ingresos (MXN)" ? formatMoney(Number(value)) : value,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            <Bar
              yAxisId="count"
              dataKey="purchases"
              name="Compras"
              fill="var(--foreground)"
              fillOpacity={0.2}
              radius={[5, 5, 0, 0]}
              maxBarSize={44}
              isAnimationActive={false}
            />
            <Line
              yAxisId="income"
              dataKey="income"
              name="Ingresos (MXN)"
              stroke="var(--foreground)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              type="linear"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {!buckets.some((bucket) => bucket.purchases) && (
        <p className="sales-empty">No hay compras registradas en este periodo.</p>
      )}
      <details className="sales-data">
        <summary>Ver tabla de datos</summary>
        <div className="overflow-x-auto">
          <table>
            <caption className="sr-only">Compras e ingresos por periodo</caption>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                <th scope="col">Compras</th>
                <th scope="col">Ingresos (MXN)</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr key={bucket.key}>
                  <th scope="row">{bucket.label}</th>
                  <td>{bucket.purchases}</td>
                  <td>{formatMoney(bucket.income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function ExpandedSales({ cafeId }: { cafeId: string }) {
  const today = businessDate();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState("all");
  const series = useQuery({
    queryKey: ["purchase-series", cafeId, year],
    queryFn: () => fetchPurchaseSeries(cafeId, `${year}-01-01`, `${year + 1}-01-01`),
  });
  const days = month === "all" ? 0 : new Date(Date.UTC(year, Number(month), 0)).getUTCDate();
  const buckets =
    month === "all"
      ? monthlySales(series.data ?? [], year)
      : dailySales(series.data ?? [], `${year}-${month}-01`, days);
  return (
    <>
      <div className="sales-period-controls">
        <button
          type="button"
          className="btn-ghost"
          aria-label="Año anterior"
          disabled={year <= 2000}
          onClick={() => setYear(year - 1)}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <strong aria-live="polite">{year}</strong>
        <button
          type="button"
          className="btn-ghost"
          aria-label="Año siguiente"
          disabled={year >= Number(today.slice(0, 4))}
          onClick={() => setYear(year + 1)}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <label>
          Periodo
          <select
            className="field"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            <option value="all">Mes por mes</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={String(i + 1).padStart(2, "0")}>
                {new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(
                  new Date(Date.UTC(year, i, 1)),
                )}
              </option>
            ))}
          </select>
        </label>
      </div>
      {series.isPending ? (
        <p role="status">Cargando historial…</p>
      ) : series.isError ? (
        <div role="alert">
          <p>No se pudo cargar el historial.</p>
          <button className="btn-ghost mt-3" onClick={() => series.refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <SalesPlot buckets={buckets} />
      )}
    </>
  );
}

export function OwnerSalesChart({ cafeId }: { cafeId: string }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(() => weekStart());
  const series = useQuery({
    queryKey: ["purchase-series", cafeId, start],
    enabled: Boolean(cafeId),
    queryFn: () => fetchPurchaseSeries(cafeId, start, shiftDate(start, 7)),
  });
  return (
    <section className="card-soft sales-chart" aria-labelledby="sales-chart-title">
      <div className="sales-chart-heading">
        <div>
          <p className="wallet-eyebrow">ACTIVIDAD DE TU CAFETERÍA</p>
          <h2 id="sales-chart-title">
            <TrendingUp className="h-5 w-5" aria-hidden="true" /> Compras e ingresos
          </h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="btn-ghost" disabled={!cafeId}>
              <Maximize2 className="h-4 w-4" aria-hidden="true" /> Expandir gráfica
            </button>
          </DialogTrigger>
          <DialogContent className="sales-dialog">
            <DialogTitle>Historial de compras e ingresos</DialogTitle>
            <DialogDescription>
              Compara mes por mes o selecciona un mes para revisar cada día. Importes en MXN; fechas
              de Ciudad de México.
            </DialogDescription>
            {open && <ExpandedSales key={cafeId} cafeId={cafeId} />}
          </DialogContent>
        </Dialog>
      </div>
      <div className="sales-period-controls">
        <button
          type="button"
          className="btn-ghost"
          aria-label="Semana anterior"
          onClick={() => setStart(shiftDate(start, -7))}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span aria-live="polite">
          {start} — {shiftDate(start, 6)}
        </span>
        <button
          type="button"
          className="btn-ghost"
          aria-label="Semana siguiente"
          disabled={start >= weekStart()}
          onClick={() => setStart(shiftDate(start, 7))}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {series.isPending ? (
        <p role="status">Cargando compras…</p>
      ) : series.isError ? (
        <div role="alert">
          <p>No se pudo cargar la gráfica.</p>
          <button className="btn-ghost mt-3" onClick={() => series.refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <SalesPlot buckets={dailySales(series.data, start, 7)} />
      )}
      <p className="sales-chart-note">
        Compras confirmadas por el personal · Ingresos registrados en MXN · Horario de Ciudad de
        México.
      </p>
    </section>
  );
}
