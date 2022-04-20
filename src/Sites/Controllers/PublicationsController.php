<?php

namespace App\Modules\Sites\Controllers;


use Colibri\App;
use Colibri\Events\EventsContainer;
use Colibri\IO\FileSystem\File;
use Colibri\Utils\Cache\Bundle;
use Colibri\Utils\Debug;
use Colibri\Utils\ExtendedObject;
use Colibri\Web\RequestCollection;
use Colibri\Web\Controller as WebController;
use Colibri\Web\Templates\PhpTemplate;
use Colibri\Web\View;
use ScssPhp\ScssPhp\Compiler;
use ScssPhp\ScssPhp\OutputStyle;
use App\Modules\Sites\Models\Pages;
use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Module;
use Colibri\Data\Models\DataModelException;
use App\Modules\Sites\Models\Publications;
use Colibri\Data\Storages\Storages;
use App\Modules\Sites\Models\Domains;

class PublicationsController extends WebController
{
    public function List(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->domain;
        if(!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);
        if(!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $folder = $post->folder;
        if($folder) {
            $folder = Pages::LoadById($folder);
            if(!$folder) {
                return $this->Finish(400, 'Bad request');
            }
        }
        else {
            $folder = 0;
        }

        $term = $post->term;
        $page = (int)$post->page ?: 1;
        $pagesize = (int)$post->pagesize ?: 20;

        $pubs = Publications::LoadByPage($domain, $folder, $term, $page, $pagesize);
        $pubsArray = [];
        foreach($pubs as $pub) {
            $pubsArray[] = $pub->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pubsArray);
    }

    public function Copy(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->domain;
        if(!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);

        $pub = $post->pub;
        if(!$pub) {
            return $this->Finish(400, 'Bad request');
        }

        $pub = Publications::LoadById($pub);
        if(!$pub) {
            return $this->Finish(400, 'Bad request');
        }

        $to = $post->to;
        $to = $to ? Pages::LoadById($to) : null;

        $newPub = $pub->Copy($domain, $to);
        if(!$newPub) {
            return $this->Finish(400, 'Bad request');
        }
        $newPub->Save();

        return $this->Finish(200, 'ok', $newPub->ToArray(true));

    }

    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $pubs = $post->pubs;
        if(!$pubs) {
            return $this->Finish(400, 'Bad request');
        }

        Publications::DeleteAllByIds(explode(',', $pubs));

        return $this->Finish(200, 'ok');
    }

    public function Create(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->domain;
        $folder = $post->folder;
        $storage = $post->storage;
        $data = $post->data;

        if(!$storage || !$data) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);
        if(!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $folder = $folder ? Pages::LoadById($folder) : null;
        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadEmpty();
        foreach($data as $field => $value) {
            $datarow->$field = $value;
        }
        $datarow->Save();

        $newPub = Publications::CreatePublication($domain, $folder, $datarow);
        $newPub->Save();

        return $this->Finish(200, 'ok', $newPub->ToArray(true));

    }

    public function Publish(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->domain;
        $domain = Domains::LoadById($domain);

        $folder = $post->folder;
        $storage = $post->storage;
        $ids = $post->ids ? explode(',', $post->ids) : [];
        if(!$ids || !$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $folder = $folder ? Pages::LoadById($folder) : null;
        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $pubArray = [];
        foreach($ids as $id) {
        
            $datarow = $tableClass::LoadById($id);
            if(!$datarow) {
                continue;
            }

            $pub = Publications::CreatePublication($domain, $folder, $datarow);
            $pub->Save();
            $pubArray[] = $pub->ToArray(true);
        
        }

        return $this->Finish(200, 'ok', $pubArray);

    }

    public function Move(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $pub = $post->pub;
        $before = $post->before;

        if(!$pub || !$before) {
            return $this->Finish(400, 'Bad request');
        }

        $pub = Publications::LoadById($pub);
        $before = Publications::LoadById($before);
        if(!$pub || !$before) {
            return $this->Finish(400, 'Bad request');
        }

        $pub->MoveBefore($before);
                
        return $this->Finish(200, 'ok', $pub->ToArray(true));

    }
}