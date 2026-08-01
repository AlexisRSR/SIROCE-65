import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticasDashboard } from './estadisticas-dashboard';

describe('EstadisticasDashboard', () => {
  let component: EstadisticasDashboard;
  let fixture: ComponentFixture<EstadisticasDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticasDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
