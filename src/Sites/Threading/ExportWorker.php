<?php

namespace App\Modules\Sites\Threading;

use App\Modules\Sites\Module;
use Colibri\Threading\Worker as BaseWorker;
use Colibri\App;
use Colibri\Data\Storages\Storages;
use Colibri\Events\EventDispatcher;
use Colibri\Events\EventsContainer;
use Colibri\IO\FileSystem\File;
use Throwable;

class ExportWorker extends BaseWorker
{
    public function Run(): void
    {

        $comet = Module::Instance()->GetCometClient();
        $downloadId = $this->_params->{'id'};

        try {

            $module = $this->_params->{'module'};
            $storage = $this->_params->{'storage'};
            $requester = $this->_params->host;
            $user = $this->_params->user;

            $term = $this->_params->{'term'};
            $filterFields = $this->_params->{'filters'};
            $sortField = $this->_params->{'sortfield'};
            $sortOrder = $this->_params->{'sortorder'};
            $cacheUrl = App::$config->Query('cache')->GetValue();
            $cachePath = App::$webRoot . $cacheUrl;
            $fileName = 'export' . microtime(true) . '.xml.xls';

            $comet->SendToUser($requester, $user, 'download-message', (object) [
                'id' => $downloadId,
                'message' => 'Starting download ' . $fileName,
                'icon' => 'Colibri.UI.LoadingIcon',
                'link' => null,
                'download' => null,
                'percent' => 0
            ], false);

            $lastPercent = 0;

            EventDispatcher::Instance()->AddEventListener(EventsContainer::Progress, function($event, $data) use ($comet, $requester, $user, $downloadId, $fileName, &$lastPercent) {
                $data = (array)$data;
                if($data['process'] !== 'ExportXML') {
                    return;
                }
                $curPercent = round($data['progress'], 2);
                if($curPercent > $lastPercent) {
                    $lastPercent = $curPercent;
                    $comet->SendToUser($requester, $user, 'download-message', (object) [
                        'id' => $downloadId,
                        'message' => 'Generating file ' . $fileName,
                        'icon' => 'Colibri.UI.LoadingIcon',
                        'link' => null,
                        'download' => null,
                        'percent' => round($data['progress'], 2)
                    ], false);
                }
            });

            $storage = Storages::Instance()->Load($storage, $module);
            [$tableClass, $rowClass] = $storage->GetModelClasses();

            $datarows = $tableClass::LoadBy(-1, 20, $term, $filterFields, $sortField ?? '', $sortOrder ?? 'asc');

            $datarows->ExportXML($cachePath . $fileName);

            $result = [
                'id' => $downloadId,
                'message' => 'Completed ' . $fileName,
                'icon' => 'Colibri.UI.LoadingIcon',
                'link' => 'Download file',
                'download' => '/' . $cacheUrl . $fileName,
                'percent' => 100
            ];

            $comet->SendToUser($requester, $user, 'download-message', (object)$result);

        } catch(Throwable $e) {
            $comet->SendToUser($requester, $user, 'download-message', (object) [
                'id' => $downloadId,
                'message' => 'An error occurred while generating the file!<br />' . $e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine() . '<br />' . $e->getTraceAsString(),
                'icon' => 'Colibri.UI.ErrorIcon',
                'link' => null,
                'download' => null,
                'percent' => 0
            ], false);
        }

    }

}
