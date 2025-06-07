<?php

namespace App\Modules\Sites\Controllers;

use Colibri\App;
use App\Modules\Sites\Module;
use Colibri\Data\Storages\Storages;
use Colibri\Web\Controller as WebController;
use Colibri\Web\PayloadCopy;
use Colibri\Web\RequestCollection;
use InvalidArgumentException;

/**
 * Provides a dashboard functionality
 * @author self
 * @package App\Modules\Sites\Controllers
 */
class DashboardController extends WebController
{

    /**
     * Gets a storages state
     * @param RequestCollection $get данные GET
     * @param RequestCollection $post данные POST
     * @param mixed $payload данные payload обьекта переданного через POST/PUT
     * @return object
     */
    public function Status(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        $code = 200;
        $result = [];
        $message = 'Result message';

        $storages = Storages::Instance();
        $list = $storages->GetStorages();
        foreach($list as $storage) {
            $result[] = $storage->GetStatus();
        }

        return $this->Finish(
            $code,
            $message,
            $result,
            'utf-8'
        );

    }


    
}