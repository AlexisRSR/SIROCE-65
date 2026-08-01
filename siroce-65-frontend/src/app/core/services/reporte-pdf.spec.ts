import { TestBed } from '@angular/core/testing';

import { ReportePdf } from './reporte-pdf';

describe('ReportePdf', () => {
  let service: ReportePdf;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportePdf);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
