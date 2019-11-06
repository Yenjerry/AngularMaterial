import { TestBed } from '@angular/core/testing';

import { FeatureProviderService } from './feature-provider.service';

describe('FeatureProviderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FeatureProviderService = TestBed.get(FeatureProviderService);
    expect(service).toBeTruthy();
  });
});
