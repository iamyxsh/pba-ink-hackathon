import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FaucetRequestDto, FaucetResponseDto } from './faucet.dto';

@ApiTags('admin')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get admin service health' })
  @ApiResponse({ status: 200, description: 'Admin service health status' })
  getAdminHealth() {
    return {
      status: 'running',
      service: 'admin-oracle-bridge',
      timestamp: new Date(),
    };
  }

  @Post('faucet')
  @ApiOperation({ 
    summary: 'Request tokens from faucet',
    description: 'Request test tokens (DOT or USDC) from the testnet faucet for development and testing purposes'
  })
  @ApiBody({ type: FaucetRequestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Faucet tokens sent successfully',
    type: FaucetResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid request or rate limit exceeded' })
  async requestFaucetTokens(@Body() faucetRequest: FaucetRequestDto): Promise<FaucetResponseDto> {
    return this.adminService.handleFaucetRequest(faucetRequest);
  }
}