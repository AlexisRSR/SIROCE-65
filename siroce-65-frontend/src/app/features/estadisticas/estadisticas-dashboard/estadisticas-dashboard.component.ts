import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EstadisticasService } from '../../../core/services/estadisticas.service';

@Component({
  standalone: false,
  selector: 'app-estadisticas-dashboard',
  templateUrl: './estadisticas-dashboard.component.html',
  styleUrls: ['./estadisticas-dashboard.component.scss']
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
    private cdr: ChangeDetectorRef
  ) {
    const hoy = new Date();
    const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.dateForm = this.fb.group({
      start: [primerDiaDelMes],
      end: [hoy]
    });
  }

  ngOnInit(): void {
    this.initEmptyCharts();
    this.loadData();
  }

  initEmptyCharts() {
    // 1. Dona: Tipos de Emergencia (Leyenda ABAJO para evitar que se aplaste)
    this.donutTiposOptions = {
      series: [],
      labels: [],
      chart: { type: 'donut', height: 350, background: 'transparent', foreColor: '#e0e0e0' },
      title: { text: 'Tipos de Emergencia', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      colors: ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'],
      stroke: { show: true, colors: ['#2a2a2a'], width: 2 },
      legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#e0e0e0' } }, // 🔥 LEYENDA ABAJO
      plotOptions: { pie: { donut: { size: '60%' } } }
    };

    // 2. Spline: Horas Pico
    this.splineOptions = {
      series: [{ name: 'Emergencias', data: [] }],
      chart: { type: 'area', height: 350, background: 'transparent', foreColor: '#e0e0e0', toolbar: { show: false } },
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] } },
      dataLabels: { enabled: false },
      xaxis: { categories: [] },
      title: { text: 'Análisis de Horas Pico', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      colors: ['#ff9800']
    };

    // 3. Dona: Reales vs Falsas Alarmas (Leyenda ABAJO)
    this.donutCanceladasOptions = {
      series: [],
      labels: ['Servicios Reales', 'Falsas Alarmas'],
      chart: { type: 'donut', height: 350, background: 'transparent', foreColor: '#e0e0e0' },
      title: { text: 'Índice de Falsas Alarmas', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      colors: ['#4caf50', '#ef5350'],
      stroke: { show: true, colors: ['#2a2a2a'], width: 2 },
      legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#e0e0e0' } }, // 🔥 LEYENDA ABAJO
      plotOptions: { pie: { donut: { size: '60%' } } }
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
        bar: { borderRadius: 4, columnWidth: '50%', dataLabels: { position: 'top' } } 
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
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      dataLabels: { enabled: true },
      xaxis: { categories: [] },
      title: { text: 'Top 5 Zonas de Riesgo', style: { color: '#ffffff' } },
      theme: { mode: 'dark' },
      colors: ['#f44336']
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

    this.statService.getDashboard(start, end).subscribe({
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