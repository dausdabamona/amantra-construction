import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have log method', () => {
    expect(typeof service.log).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof service.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof service.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(typeof service.debug).toBe('function');
  });

  it('should have verbose method', () => {
    expect(typeof service.verbose).toBe('function');
  });

  describe('logging methods', () => {
    it('should call log without throwing', () => {
      expect(() => {
        service.log('Test message', 'TestContext');
      }).not.toThrow();
    });

    it('should call error without throwing', () => {
      expect(() => {
        service.error('Error message', 'Stack trace', 'ErrorContext');
      }).not.toThrow();
    });

    it('should call warn without throwing', () => {
      expect(() => {
        service.warn('Warning message', 'WarnContext');
      }).not.toThrow();
    });

    it('should call debug without throwing', () => {
      expect(() => {
        service.debug('Debug message', 'DebugContext');
      }).not.toThrow();
    });

    it('should call verbose without throwing', () => {
      expect(() => {
        service.verbose('Verbose message', 'VerboseContext');
      }).not.toThrow();
    });
  });
});
