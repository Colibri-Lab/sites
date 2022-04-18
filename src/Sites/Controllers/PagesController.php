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
use App\Modules\Sites\Models\Domains;
use Colibri\Data\Storages\Storages;

class PagesController extends WebController
{
    public function Domains(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance?->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance?->current?->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domains = Domains::LoadAll();
        $domainsArray = [];
        foreach($domains as $domain) {
            $domainsArray[$domain->id] = $domain->ToArray(true);
        }
        return $this->Finish(200, 'ok', $domainsArray);
    }

    public function DomainKeys(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $config = App::$config->Query('hosts.domains')->AsArray();
        $array = array_keys($config);
        // надо получить список доменов с ключами и выдать для вывода при выборе настрок домена
        // дальше, при входе на сайт (любой из) запрос в список сайтов на получение по ключу домена - если не нашлось то 404, если нашлось 
        // то запускаем страницу MainFrame из выбранного модуля
        
        $return = [];
        foreach($array as $key) {
            $return[] = ['value' => $key, 'title' => $key];
        }

        return $this->Finish(200, 'ok', $return);
    }
    public function Properties(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = Storages::Create()->Load($post->type);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($post->object);
        if(!$datarow) {
            return $this->Finish(400, 'Bad request');
        }

        if($post->type == 'domains') {
            $parameters = $datarow->additional->parameters->ToArray();
        }
        else if($post->type == 'pages') {
            $path = $datarow->Path();
            $parameters = $datarow->domain->additional->parameters->ToArray();
            foreach($path as $page) {
                $parameters = array_merge($parameters, $page->additional->parameters->ToArray());
            }
        }

        $fields = [];
        foreach($parameters as $parameter) {
            $fields[$parameter->name] = [
                'type' => $parameter->type,
                'length' => $parameter->length,
                'class' => $parameter->class, 
                'component' => $parameter->component,
                'default' => $parameter->default,
                'desc' => $parameter->description
            ];
        }

        return $this->Finish(200, 'ok', ['fields' => $fields]);
    }

    public function SaveProperties(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = Storages::Create()->Load($post->type);
        if(!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($post->object);
        if(!$datarow) {
            return $this->Finish(400, 'Bad request');
        }

        $datarow->parameters = $post->data;
        $datarow->Save();

        return $this->Finish(200, 'ok', $datarow->parameters->ToArray());
    }

    public function List(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $pages = Pages::LoadAll();
        $pagesArray = [];
        foreach($pages as $page) {
            $pagesArray[$page->id] = $page->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pagesArray);
    }
    
    public function Save(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        if(!$id && !SecurityModule::$instance->current->IsCommandAllowed('sites.structure.add')) {
            return $this->Finish(403, 'Permission denied');
        }
        else if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->domain;
        if(!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);

        $parent = $post->parent;
        if($parent) {
            $parent = Pages::LoadById($parent);
        }
        else {
            $parent = null;
        }

        if(!$id) {
            $page = Pages::LoadEmpty($domain, $parent);
            $page->name = $post->name;
        }
        else {
            $page = Pages::LoadById($id);
        }

        foreach($post as $k => $v) {
            if(!in_array($k, ['domain', 'id', 'parent', 'order'])) {
                $page->$k = $v;
            }
        }
        $page->Save();

        return $this->Finish(200, 'ok', $page->ToArray(true));

    }

    
    public function SaveDomain(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        if(!$id && !SecurityModule::$instance->current->IsCommandAllowed('sites.structure.add')) {
            return $this->Finish(403, 'Permission denied');
        }
        else if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!$id) {
            $domain = Domains::LoadEmpty();
            $domain->name = $post->name;
        }
        else {
            $domain = Domains::LoadById($id);
        }

        foreach($post as $k => $v) {
            if(!in_array($k, ['id', 'datecreated'])) {
                $domain->$k = $v;
            }
        }

        $domain->Save();

        return $this->Finish(200, 'ok', $domain->ToArray(true));

    }

    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        $page = Pages::LoadById($id);
        try {
            $page->Delete();
        }
        catch(DataModelException $e) {
            return $this->Finish(400, 'Bad request');
        }

        $pages = Pages::LoadAll();
        $pagesArray = [];
        foreach($pages as $page) {
            $pagesArray[$page->id] = $page->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pagesArray);

    }

    public function DeleteDomain(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        $domain = Domains::LoadById($id);
        try {
            $domain->Delete();
        }
        catch(DataModelException $e) {
            return $this->Finish(400, 'Bad request');
        }

        $domains = Domains::LoadAll();
        $domainsArray = [];
        foreach($domains as $domain) {
            $domainsArray[$domain->id] = $domain->ToArray(true);
        }
        return $this->Finish(200, 'ok', $domainsArray);

    }

    public function Move(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        $move = $post->move;
        $domain = $post->domain;
        $to = $post->to;

        if(!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        $move = Pages::LoadById($move);
        if(!$move) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);
        if(!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $to = $to ? Pages::LoadById($to) : null;
        
        if(!$move->MoveTo($to ?: $domain)) {
            return $this->Finish(400, 'Bad request');
        }

        $pages = Pages::LoadAll();
        $pagesArray = [];
        foreach($pages as $page) {
            $pagesArray[$page->id] = $page->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pagesArray);

    }

}