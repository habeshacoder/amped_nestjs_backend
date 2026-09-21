import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchDto } from './dto';

describe('SearchController', () => {
  let controller: SearchController;
  let service: {
    suggest: jest.Mock;
    suggestChannel: jest.Mock;
    suggestUser: jest.Mock;
    suggestSellerProfile: jest.Mock;
    suggestProfile: jest.Mock;
    suggestChannelMaterial: jest.Mock;
    suggestSubscriptionPlan: jest.Mock;
    suggestReplays: jest.Mock;
    suggestRate: jest.Mock;
    suggestReport: jest.Mock;
  };

  const mockResponse = { success: true, mainMatches: [], count: 0 };
  const dto: SearchDto = { key: 'test' };

  beforeEach(async () => {
    service = {
      suggest: jest.fn().mockResolvedValue(mockResponse),
      suggestChannel: jest.fn().mockResolvedValue(mockResponse),
      suggestUser: jest.fn().mockResolvedValue(mockResponse),
      suggestSellerProfile: jest.fn().mockResolvedValue(mockResponse),
      suggestProfile: jest.fn().mockResolvedValue(mockResponse),
      suggestChannelMaterial: jest.fn().mockResolvedValue(mockResponse),
      suggestSubscriptionPlan: jest.fn().mockResolvedValue(mockResponse),
      suggestReplays: jest.fn().mockResolvedValue(mockResponse),
      suggestRate: jest.fn().mockResolvedValue(mockResponse),
      suggestReport: jest.fn().mockResolvedValue(mockResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: service }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('suggest should delegate to service.suggest', async () => {
    const result = await controller.suggest(dto);
    expect(service.suggest).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestChannel should delegate to service.suggestChannel', async () => {
    const result = await controller.suggestChannel(dto);
    expect(service.suggestChannel).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestUser should delegate to service.suggestUser', async () => {
    const result = await controller.suggestUser(dto);
    expect(service.suggestUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestSellerProfile should delegate to service.suggestSellerProfile', async () => {
    const result = await controller.suggestSellerProfile(dto);
    expect(service.suggestSellerProfile).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestProfile should delegate to service.suggestProfile', async () => {
    const result = await controller.suggestProfile(dto);
    expect(service.suggestProfile).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestChanneMaterial should delegate to service.suggestChannelMaterial', async () => {
    const result = await controller.suggestChanneMaterial(dto);
    expect(service.suggestChannelMaterial).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestSubscriptionPlan should delegate to service.suggestSubscriptionPlan', async () => {
    const result = await controller.suggestSubscriptionPlan(dto);
    expect(service.suggestSubscriptionPlan).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestReplays should delegate to service.suggestReplays', async () => {
    const result = await controller.suggestReplays(dto);
    expect(service.suggestReplays).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestRate should delegate to service.suggestRate', async () => {
    const result = await controller.suggestRate(dto);
    expect(service.suggestRate).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('suggestReport should delegate to service.suggestReport', async () => {
    const result = await controller.suggestReport(dto);
    expect(service.suggestReport).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });

  it('checkVercel should return vercel greeting message', () => {
    expect(controller.checkVercel()).toBe('congra! connected to vercel');
  });
});
