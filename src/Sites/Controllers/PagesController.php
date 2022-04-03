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

class PagesController extends WebController
{
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
        }
        else if(!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }


        $parent = $post->parent;
        if($parent) {
            $parent = Pages::LoadById($parent);
        }
        else {
            $parent = null;
        }

        if(!$id) {
            $page = Pages::LoadEmpty($parent);
            $page->name = $post->name;
        }
        else {
            $page = Pages::LoadById($id);
        }

        $page->description = $post->description;
        $page->published = $post->published;
        $page->additional = $post->additional;
        $page->Save();

        return $this->Finish(200, 'ok', $page->ToArray(true));

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

}