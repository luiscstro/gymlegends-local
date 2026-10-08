import { ChevronLeft, LineChart as LineChartIcon, TrendingDown, TrendingUp, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/skeleton';
import { shortDate } from '@/lib/date-utils';
import { listExerciseProgress, type ExerciseSessionPoint } from '@/lib/data/history';
import { formatWeight } from '@/lib/number-utils';
import { filterByRange, maxWeightOf, RANGES, weightTrend, type Range } from '@/lib/progress-utils';
import { useAuth } from '@/providers/auth-provider';

export default function ExerciseHistoryPage() {
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name') ?? 'Exercício';
  const { user } = useAuth();

  const [points, setPoints] = useState<ExerciseSessionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [range, setRange] = useState<Range>('3M');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!user || !exerciseId) return;
    let cancelled = false;
    listExerciseProgress(user.uid, exerciseId)
      .then((result) => {
        if (!cancelled) setPoints(result);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, exerciseId]);

  const filtered = useMemo(() => filterByRange(points, range, now), [points, range, now]);
  const maxWeight = maxWeightOf(filtered);
  const trend = useMemo(() => weightTrend(filtered), [filtered]);
  const chartData = filtered.map((p) => ({ label: shortDate(p.date), kg: p.maxWeight }));
  // Largura do eixo Y acompanha o número de dígitos — senão "1234" vira "234" cortado
  const yAxisWidth = 14 + String(Math.round(maxWeight)).length * 8;

  function goBack() {
    // Abriu direto pelo link (sem histórico)? Volta para a lista em vez de sair do app.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/history');
  }

  return (
    <div className="animate-page-enter pb-6">
      <header className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface transition-transform active:scale-90">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl leading-tight font-semibold" title={name}>
            {name}
          </h1>
          <p className="text-sm text-text-secondary">Evolução de carga</p>
        </div>
      </header>

      <div className="space-y-4 px-4">
        <div role="tablist" aria-label="Período" className="grid grid-cols-4 gap-1 rounded-xl bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={range === r.key}
              onClick={() => setRange(r.key)}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                range === r.key ? 'bg-primary text-white' : 'text-text-secondary'
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : failed ? (
          <EmptyState icon={WifiOff} title="Não foi possível carregar" description="Verifique a conexão e tente de novo." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={LineChartIcon}
            title="Sem registros no período"
            description="Tente um intervalo maior ou registre mais séries desse exercício."
          />
        ) : (
          <>
            <section className="animate-row-enter space-y-2 overflow-hidden rounded-2xl bg-surface p-4">
              <h2 className="text-sm font-semibold text-text-secondary">CARGA MÁXIMA</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-display text-5xl leading-none font-bold tabular-nums">
                  {formatWeight(maxWeight)}
                  <span className="text-2xl text-text-secondary"> kg</span>
                </p>
                {trend && trend.delta !== 0 && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm whitespace-nowrap ${
                      trend.delta > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}>
                    {trend.delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trend.delta > 0 ? '+' : '−'}
                    {formatWeight(Math.abs(trend.delta))} kg em {trend.weeks} sem.
                  </span>
                )}
              </div>

              {chartData.length >= 2 ? (
                <div className="h-48 w-full pt-2" aria-label="Gráfico de evolução de carga" role="img">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                      <defs>
                        <linearGradient id="kgFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3C87F7" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#3C87F7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#8E8E93"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={16}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#8E8E93"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={yAxisWidth}
                        domain={['auto', 'auto']}
                        allowDecimals={false}
                        tickFormatter={(v: number) => formatWeight(v)}
                      />
                      <Tooltip
                        contentStyle={{ background: '#18181B', border: '1px solid #2A2A2E', borderRadius: 8 }}
                        labelStyle={{ color: '#8E8E93' }}
                        formatter={(value) => [`${formatWeight(Number(value))} kg`, 'Carga']}
                      />
                      <Area
                        type="monotone"
                        dataKey="kg"
                        stroke="#3C87F7"
                        strokeWidth={2}
                        fill="url(#kgFill)"
                        dot={{ r: 3, fill: '#3C87F7' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="pt-1 text-sm text-text-secondary">Registre mais uma sessão para ver o gráfico.</p>
              )}
            </section>

            <h2 className="text-sm font-semibold text-text-secondary">ÚLTIMAS SESSÕES</h2>
            <ul className="divide-y divide-border rounded-2xl bg-surface px-4">
              {[...filtered]
                .reverse()
                .slice(0, 10)
                .map((point) => (
                  <li key={point.sessionId} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-text-secondary">{shortDate(point.date)}</span>
                    <span className="font-semibold whitespace-nowrap tabular-nums">
                      {formatWeight(point.maxWeight)} kg × {point.repsAtMaxWeight}
                    </span>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
