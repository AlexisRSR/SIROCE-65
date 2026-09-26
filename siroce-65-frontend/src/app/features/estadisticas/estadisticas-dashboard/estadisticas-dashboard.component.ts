import { Component, OnInit, ChangeDetectorRef, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  standalone: false,
  selector: 'app-estadisticas-dashboard',
  templateUrl: './estadisticas-dashboard.component.html',
  styleUrls: ['./estadisticas-dashboard.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-GT' }]
})
export class EstadisticasDashboardComponent implements OnInit {
  dateForm: FormGroup;
  isLoading = false;

  kpis = { total: 0, enAtencion: 0, finalizadas: 0, canceladas: 0, tiempoPromedioMinutos: 0 };
  
  // 🔥 NUEVAS GRÁFICAS ESTRATÉGICAS
  donutTiposOptions: any = { series: [] };
  donutCanceladasOptions: any = { series: [] };
  splineOptions: any = { series: [{ data: [] }] };
  barOptions: any = { series: [] };
  barZonasOptions: any = { series: [] };
  
  estadoFuerza: any[] = [];
  estadoFlota: any[] = [];
  insumosAlertas: any[] = []; 
  actividadReciente: any[] = [];

  constructor(
    private fb: FormBuilder,
    private statService: EstadisticasService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
    private destroyRef: DestroyRef
  ) {
    const hoy = new Date();
    const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.dateForm = this.fb.group({
      start: [primerDiaDelMes],
      end: [hoy]
    });

    // 🔥 Borde de las donas dinámico: se recalcula al alternar tema claro/oscuro
    effect(() => {
      this.themeService.isLight();
      this.refreshDonutStroke();
    });
  }

  ngOnInit(): void {
    this.initEmptyCharts();
    this.loadData();
  }

  /** Color de fondo real de la tarjeta (var(--bg-card)): blanco en claro, gris de tarjeta en oscuro. */
  private getCardBackground(): string {
    if (typeof window === 'undefined') return '#ffffff';
    return getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff';
  }

  /** plotOptions.pie.donut compartido: hueco 75% + labels centrales (Total) legibles en ambos temas. */
  private getDonutPlotOptions() {
    // El '#373d3f' de ejemplo de ApexCharts es ilegible sobre tarjeta oscura;
    // se usa var(--text-bright) para que el texto central siga al tema activo.
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-bright').trim() || '#373d3f';
    return {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { color: textColor },
            value: { color: textColor },
            total: { show: true, label: 'Total', color: textColor }
          }
        }
      }
    };
  }

  private refreshDonutStroke(): void {
    const cardBg = this.getCardBackground();
    const stroke = { show: true, colors: [cardBg], width: 2 };
    const tooltip = { enabled: true, theme: this.themeService.isLight() ? 'light' : 'dark' };
    const plotOptions = this.getDonutPlotOptions();
    this.donutTiposOptions = { ...this.donutTiposOptions, stroke, tooltip, plotOptions };
    this.donutCanceladasOptions = { ...this.donutCanceladasOptions, stroke, tooltip, plotOptions };
  }

  // 🔥 Empty states: distinguen "sin datos" de "todo en cero", no solo arreglo vacío
  get hasDonutTipos(): boolean {
    const s = this.donutTiposOptions.series;
    return Array.isArray(s) && s.some((v: number) => v > 0);
  }

  get hasDonutCanceladas(): boolean {
    const s = this.donutCanceladasOptions.series;
    return Array.isArray(s) && s.some((v: number) => v > 0);
  }

  get hasHorasPico(): boolean {
    const data = this.splineOptions.series?.[0]?.data;
    return Array.isArray(data) && data.some((v: number) => v > 0);
  }

  get hasVolumenDiario(): boolean {
    const series = this.barOptions.series;
    return Array.isArray(series) && series.some((serie: any) => (serie.data || []).some((v: number) => v > 0));
  }

  get hasZonasRiesgo(): boolean {
    const series = this.barZonasOptions.series;
    return Array.isArray(series) && series.some((serie: any) => (serie.data || []).some((v: number) => v > 0));
  }

  initEmptyCharts() {
    const cardBg = this.getCardBackground();

    // 1. Dona: Tipos de Emergencia
    this.donutTiposOptions = {
      series: [],
      labels: [],
      chart: { type: 'donut', height: 350, background: 'transparent', foreColor: '#e0e0e0' },
      title: { text: 'Tipos de Emergencia', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      // 🔥 Paleta corporativa suave (antes: rojo/verde/azul/naranja neón)
      colors: ['#b71c1c', '#5c7f9b', '#4a8b82', '#8d6e63', '#7e6ba6'],
      // 🔥 Borde dinámico: coincide con el fondo real de la tarjeta (blanco en claro)
      stroke: { show: true, colors: [cardBg], width: 2 },
      // 🔥 Sin porcentajes internos (se amontonaban con muchas categorías): la info va en el tooltip
      dataLabels: { enabled: false },
      tooltip: { enabled: true, theme: this.themeService.isLight() ? 'light' : 'dark' },
      legend: { position: 'right', fontSize: '12px', labels: { colors: '#e0e0e0' } },
      // 🔥 Bajo 768px la leyenda baja para no aplastar el círculo
      responsive: [{ breakpoint: 768, options: { legend: { position: 'bottom' } } }],
      plotOptions: this.getDonutPlotOptions()
    };

    // 2. Spline: Horas Pico
    this.splineOptions = {
      series: [{ name: 'Emergencias', data: [] }],
      chart: { type: 'area', height: 350, background: 'transparent', foreColor: '#e0e0e0', toolbar: { show: false } },
      // 🔥 curve:'smooth' es el equivalente en ApexCharts a tension:0.4 en Chart.js
      stroke: { curve: 'smooth', width: 3 },
      // 🔥 Gradiente lineal vertical: color principal difuminándose a transparente hacia abajo
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: 'vertical', shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0, stops: [0, 100] }
      },
      dataLabels: { enabled: false },
      xaxis: { categories: [] },
      title: { text: 'Análisis de Horas Pico', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      colors: ['#b71c1c']
    };

    // 3. Dona: Reales vs Falsas Alarmas
    this.donutCanceladasOptions = {
      series: [],
      labels: ['Servicios Reales', 'Falsas Alarmas'],
      chart: { type: 'donut', height: 350, background: 'transparent', foreColor: '#e0e0e0' },
      title: { text: 'Índice de Falsas Alarmas', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      // 🔥 Paleta corporativa suave (antes: verde/rojo neón)
      colors: ['#4a8b82', '#a94442'],
      stroke: { show: true, colors: [cardBg], width: 2 },
      dataLabels: { enabled: false },
      tooltip: { enabled: true, theme: this.themeService.isLight() ? 'light' : 'dark' },
      legend: { position: 'right', fontSize: '12px', labels: { colors: '#e0e0e0' } },
      responsive: [{ breakpoint: 768, options: { legend: { position: 'bottom' } } }],
      plotOptions: this.getDonutPlotOptions()
    };

    // 4. Barras Agrupadas: Emergencias vs Servicios
    this.barOptions = {
      series: [
        { name: '🚨 Emergencias (Críticas)', data: [] },
        { name: '💧 Servicios (Rutina)', data: [] }
      ],
      chart: {
        type: 'bar', height: 350, stacked: false, background: 'transparent', foreColor: '#9aa0ac', toolbar: { show: false }
      },
      plotOptions: {
        // 🔥 borderRadiusApplication:'end' redondea solo la esquina superior de la barra
        bar: { borderRadius: 6, borderRadiusApplication: 'end', columnWidth: '50%', dataLabels: { position: 'top' } }
      },
      dataLabels: {
        enabled: true, style: { colors: ['#ffffff'], fontSize: '11px' }, offsetY: -20
      },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: [] },
      yaxis: { title: { text: 'Cantidad Registrada', style: { color: '#9aa0ac' } } },
      title: { text: 'Volumen Diario (Emergencias vs Servicios)', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },

      // 🔥 NUEVO: Color Vino (#b71c1c) para Emergencias y Celeste Pastel (#90caf9) para Servicios
      colors: ['#bc8f8f', '#80b2ac'],

      legend: { position: 'top', horizontalAlign: 'right' },
      tooltip: { theme: 'dark' }
    };

    // 5. Barras Horizontales: Top Zonas de Riesgo
    this.barZonasOptions = {
      series: [],
      chart: { type: 'bar', height: 350, background: 'transparent', foreColor: '#e0e0e0', toolbar: { show: false } },
      // 🔥 borderRadiusApplication:'end' redondea solo la punta de la barra (derecha, en horizontal)
      plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: 'end', horizontal: true } },
      dataLabels: { enabled: true },
      xaxis: { categories: [] },
      title: { text: 'Top 5 Zonas de Riesgo', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      colors: ['#b71c1c']
    };
  }

  private formatDateLocal(dateStr: any): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  loadData() {
    this.isLoading = true;
    const start = this.formatDateLocal(this.dateForm.value.start);
    const end = this.formatDateLocal(this.dateForm.value.end);

    this.statService.getDashboard(start, end).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        if (res.ok && res.data) {
          
          // Mapeo seguro de KPIs
          this.kpis = {
            total: res.data.kpis.total || 0,
            enAtencion: res.data.kpis.enAtencion || 0,
            finalizadas: res.data.kpis.finalizadas || 0,
            canceladas: res.data.kpis.canceladas || 0,
            tiempoPromedioMinutos: res.data.kpis.tiempoPromedioMinutos || 0
          };

          // 1. Dona de Tipos
          if (res.data.graficoTipos) {
            this.donutTiposOptions.labels = res.data.graficoTipos.map((i: any) => i.tipo);
            this.donutTiposOptions.series = res.data.graficoTipos.map((i: any) => i.cantidad);
          }

          // 2. Horas Pico
          if (res.data.graficoHoras) {
            this.splineOptions.series = [{ name: 'Emergencias', data: res.data.graficoHoras.map((i: any) => i.cantidad) }];
            this.splineOptions.xaxis = { categories: res.data.graficoHoras.map((i: any) => i.hora) };
          }

          // 3. Falsas Alarmas (Calculado dinámicamente)
          const falsas = this.kpis.canceladas;
          const reales = this.kpis.total - falsas;
          this.donutCanceladasOptions.series = [reales > 0 ? reales : 0, falsas];

          /// 4. Tendencia Diaria (Extraemos los datos exactos del Backend)
          if (res.data.graficoFechasApilado) {
            const categoriasFechas = res.data.graficoFechasApilado.map((item: any) => item.fecha);
            
            // Sacamos los números directos que nos mandó el Backend
            const dataEmergencias = res.data.graficoFechasApilado.map((item: any) => item.detalle.Emergencias || 0);
            const dataServicios = res.data.graficoFechasApilado.map((item: any) => item.detalle.Servicios || 0);

            this.barOptions.series = [
              { name: 'Emergencias (Críticas)', data: dataEmergencias },
              { name: 'Servicios (Rutina)', data: dataServicios }
            ];
            this.barOptions.xaxis = { categories: categoriasFechas };
          }
          // 5. Barras Zonas de Riesgo (Con datos de muestra si el backend no los manda aún)
          if (res.data.graficoZonas && res.data.graficoZonas.length > 0) {
            this.barZonasOptions.series = [{ name: 'Incidentes', data: res.data.graficoZonas.map((z: any) => z.cantidad) }];
            this.barZonasOptions.xaxis = { categories: res.data.graficoZonas.map((z: any) => z.zona) };
          } else {
            this.barZonasOptions.series = [{ name: 'Incidentes', data: [14, 9, 6, 4, 2] }];
            this.barZonasOptions.xaxis = { categories: ['Centro', 'Caserío El Nance', 'Ruta CA-2', 'Colonia Mariscal', 'Mercado'] };
          }

          // Logística
          this.estadoFuerza = res.data.estadoFuerza || [];
          this.estadoFlota = res.data.estadoFlota || [];
          this.insumosAlertas = res.data.insumosCriticos || [];
          this.actividadReciente = res.data.actividadReciente || [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error al cargar las estadísticas', 'OK', { duration: 3000 });
      }
    });
  }

  // 🔥 VALIDACIÓN MEJORADA DEL FILTRO DE FECHAS
  aplicarFiltro() {
    if (this.dateForm.valid && this.dateForm.value.start && this.dateForm.value.end) {
      console.log('Filtrando desde:', this.dateForm.value.start, 'hasta:', this.dateForm.value.end);
      this.loadData();
    } else {
      this.snackBar.open('⚠️ Por favor, seleccione un rango de fechas completo (Inicio y Fin).', 'OK', { duration: 4000 });
    }
  }
}