import { TestBed } from '@angular/core/testing';

import { FlowServiceService } from './flow-service.service';

describe('FlowServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FlowServiceService = TestBed.get(FlowServiceService);
    expect(service).toBeTruthy();
  });
});
