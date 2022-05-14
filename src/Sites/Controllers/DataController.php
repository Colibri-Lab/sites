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
use Colibri\Data\DataAccessPoint;

class DataController extends WebController
{

    public function List(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.'.list')) {
            return $this->Finish(403, 'Permission denied');
        }

        $term = $post->term;
        $sortField = $post->sortfield;
        $sortOrder = $post->sortorder;
        $page = (int)$post->page ?: 1;
        $pagesize = (int)$post->pagesize ?: 20;

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $filters = [];
        foreach($storage->fields as $field) {
            if($field->class === 'string') {
                $filters[] = '{'.$field->name.'} like [[term:string]]';
            }
        }

        if(!$sortField) {
            $sortField = '{datecreated}';
        }
        else {
            $sortField = '{'.$sortField.'}';
        }
        if(!$sortOrder) {
            $sortOrder = 'asc';
        }

        if(!empty($filters)) {
            $datarows = $tableClass::LoadByFilter($page, $pagesize, implode(' or ', $filters), $sortField.' '.$sortOrder, ['term' => '%'.$term.'%']);
        }
        else {
            $datarows = $tableClass::LoadByFilter($page, $pagesize, '', $sortField.' '.$sortOrder);
        }
        if(!$datarows) {
            return $this->Finish(400, 'Bad request');
        }

        $dataArray = [];
        foreach($datarows as $datarow) {
            $dataArray[] = $datarow->ToArray(true);
        }
        return $this->Finish(200, 'ok', $dataArray);


    }
    
    public function Row(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.'.list')) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->row;

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($id);
        if(!$datarow) {
            return $this->Finish(400, 'Bad request');
        }
        
        return $this->Finish(200, 'ok', $datarow->ToArray(true));

    }

    public function Save(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        $data = (object)$post->data;
        $pub = $post->pub;

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.($data->id ?? 0 ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }


        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        
        if($data->id ?? 0) {
            $datarow = $tableClass::LoadById($data->id);
            if(!$datarow) {
                return $this->Finish(400, 'Bad request');
            }    
        }
        else {
            $datarow = $tableClass::LoadEmpty();
        }

        foreach($data as $key => $value) {
            $datarow->$key = $value;
        }

        $datarow->Save();

        if($pub) {
            $pub = Publications::LoadById($pub);
            $pub->Save();
            $pub = $pub->ToArray(true);
        }
        
        return $this->Finish(200, 'ok', ['datarow' => $datarow->ToArray(true), 'pub' => $pub]);

    }

    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->storage;
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }
        
        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.'.$storage.'.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $ids = $post->ids;
        if(!$ids) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if(!$tableClass::DeleteAllByIds(explode(',', $ids))) {
            return $this->Finish(400, 'Bad request');
        }

        return $this->Finish(200, 'ok');
    }


}