import {
    Controller,
    Delete,
    Get,
    Param,
    Put,
    UseGuards,
    Body,
    Query,
} from '@nestjs/common';
import { VersionService } from '@/versions/version.service';
import { VersionExistsGuard } from '@/versions/guards/version.exists.guard';
import { UpdateVersionDto } from '@/versions/dto/update.version.dto';
import { VersionParamsDto } from '@/versions/dto/version.params.dto';

@Controller('/versions')
export class VersionController {
    constructor(private readonly versionService: VersionService) {}

    @Get()
    findAll(@Query() params: VersionParamsDto) {
        return this.versionService.findAll(params);
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

    @Put(':id')
    update(
        @Param('id') id: number,
        @Body() updateVersionDto: UpdateVersionDto,
    ) {
        return this.versionService.update(id, updateVersionDto);
    }
}
