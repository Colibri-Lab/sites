<?php

namespace App\Modules\Sites\Controllers;

use Colibri\Web\RequestCollection;
use Colibri\Web\Controller as WebController;
use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Domains;

class ChecksController extends WebController
{
    public function Domain(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        $domain = Domains::LoadByName($post->current);
        if (!$domain) {
            return $this->Finish(200, 'Not found');
        }
        return $this->Finish(200, 'ok', $domain->ToArray(true));
    }

}