import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { VersionService } from '@/versions/version.service';
import { VersionExistsGuard } from '@/versions/guards/version.exists.guard';

@Controller('/versions')
export class VersionController {
    constructor(private readonly versionService: VersionService) {}

    @Get()
    findAll() {
        return this.versionService.findAll();
    }

    @Get(':id')
    @UseGuards(VersionExistsGuard)
    getOne(@Param('id') id: number) {
        return this.versionService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(VersionExistsGuard)
    remove(@Param('id') id: number) {
        return this.versionService.removeOne(id);
    }
}
