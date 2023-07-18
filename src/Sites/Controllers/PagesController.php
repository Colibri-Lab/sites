<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Domains;
use App\Modules\Sites\Models\Pages;
use Colibri\App;
use Colibri\Data\Models\DataModelException;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\ValidationException;
use Colibri\Web\Controller as WebController;
use Colibri\Web\RequestCollection;
use InvalidArgumentException;

/**
 * Pages controller
 */
class PagesController extends WebController
{
    /**
     * Returns a domain list
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Domains(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance?->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance?->current?->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domains = Domains::LoadAll();
        $domainsArray = [];
        foreach ($domains as $domain) {
            $domainsArray[$domain->id] = $domain->ToArray(true);
        }
        return $this->Finish(200, 'ok', $domainsArray);
    }

    public function DomainKeys(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $config = App::$config->Query('hosts.domains')->AsArray();
        $array = array_keys($config);
        // надо получить список доменов с ключами и выдать для вывода при выборе настрок домена
        // дальше, при входе на сайт (любой из) запрос в список сайтов на получение по ключу домена - если не нашлось то 404, если нашлось 
        // то запускаем страницу MainFrame из выбранного модуля

        $return = [];
        foreach ($array as $key) {
            $return[] = ['value' => $key, 'title' => $key];
        }

        return $this->Finish(200, 'ok', $return);
    }

    /**
     * Returns a custom properties for domain or folder
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Properties(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = Storages::Create()->Load($post->{'type'});
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($post->{'object'});
        if (!$datarow) {
            return $this->Finish(400, 'Bad request');
        }

        if ($post->{'type'} == 'domains') {
            $parameters = $datarow->additional->parameters->ToArray();
        } elseif ($post->{'type'} == 'pages') {
            $path = $datarow->Path();
            $parameters = $datarow->domain->additional->parameters->ToArray();
            foreach ($path as $page) {
                $parameters = array_merge($parameters, $page->additional->parameters->ToArray());
            }
        }

        $fields = [];
        foreach ($parameters as $parameter) {
            $fields[$parameter['name']] = [
                'type' => $parameter['type'],
                'length' => $parameter['length'],
                'class' => $parameter['class'],
                'component' => $parameter['component'],
                'default' => $parameter['default'],
                'desc' => $parameter['description'],
                'attrs' => $parameter['attrs']
            ];
        }

        return $this->Finish(200, 'ok', ['fields' => $fields]);
    }

    /**
     * Saves a custom properties data
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function SaveProperties(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = Storages::Create()->Load($post->{'type'});
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($post->{'object'});
        if (!$datarow) {
            return $this->Finish(400, 'Bad request');
        }

        $accessPoint = $datarow->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            $datarow->parameters = $post->{'data'};
            $datarow->Save();

        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            return $this->Finish(400, 'Bad request', ['message' => $e->getMessage(), 'code' => 400]);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application validation error', ['message' => $e->getMessage(), 'code' => 400, 'data' => $e->getExceptionDataAsArray()]);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application error', ['message' => $e->getMessage(), 'code' => 500]);
        }

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', $datarow->parameters->ToArray());
    }

    /**
     * Returns a pages list
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function List(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure')) {
            return $this->Finish(403, 'Permission denied');
        }

        $pages = Pages::LoadAll();
        $pagesArray = [];
        foreach ($pages as $page) {
            $pagesArray[$page->id] = $page->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pagesArray);
    }

    /**
     * Saves a page data
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @throws InvalidArgumentException
     * @return object
     */
    public function Save(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->{'id'};
        if (!$id && !SecurityModule::$instance->current->IsCommandAllowed('sites.structure.add')) {
            return $this->Finish(403, 'Permission denied');
        } elseif (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->{'domain'};
        if (!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);

        $parent = $post->{'parent'};
        if ($parent) {
            $parent = Pages::LoadById($parent);
        } else {
            $parent = null;
        }

        if (!$id) {
            $page = Pages::LoadEmpty($domain, $parent);
            $page->name = $post->{'name'};
        } else {
            $page = Pages::LoadById($id);
        }


        $accessPoint = $page->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            foreach ($post as $k => $v) {
                if (!in_array($k, ['domain', 'id', 'parent', 'order', '__raw'])) {
                    $page->$k = $v;
                }
            }

            if (($res = $page->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            return $this->Finish(400, 'Bad request', ['message' => $e->getMessage(), 'code' => 400]);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application validation error', ['message' => $e->getMessage(), 'code' => 400, 'data' => $e->getExceptionDataAsArray()]);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application error', ['message' => $e->getMessage(), 'code' => 500]);
        }

        $accessPoint->Commit();



        return $this->Finish(200, 'ok', $page->ToArray(true));

    }

    /**
     * Saves a domain
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @throws InvalidArgumentException
     * @return object
     */
    public function SaveDomain(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->{'id'};
        if (!$id && !SecurityModule::$instance->current->IsCommandAllowed('sites.structure.add')) {
            return $this->Finish(403, 'Permission denied');
        } elseif (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!$id) {
            $domain = Domains::LoadEmpty();
            $domain->name = $post->{'name'};
        } else {
            $domain = Domains::LoadById($id);
        }

        $accessPoint = $domain->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            foreach ($post as $k => $v) {
                if (!in_array($k, ['id', 'datecreated', '__raw'])) {
                    $domain->$k = $v;
                }
            }

            if (($res = $domain->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            return $this->Finish(400, 'Bad request', ['message' => $e->getMessage(), 'code' => 400]);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application validation error', ['message' => $e->getMessage(), 'code' => 400, 'data' => $e->getExceptionDataAsArray()]);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application error', ['message' => $e->getMessage(), 'code' => 500]);
        }

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', $domain->ToArray(true));

    }

    /**
     * Deletes a page
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->{'id'};
        $page = Pages::LoadById($id);
        try {
            $page->Delete();
        } catch (DataModelException $e) {
            return $this->Finish(400, 'Bad request');
        }

        $pages = Pages::LoadAll();
        $pagesArray = [];
        foreach ($pages as $page) {
            $pagesArray[$page->id] = $page->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pagesArray);

    }

    /**
     * Deletes a domain
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function DeleteDomain(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->{'id'};
        $domain = Domains::LoadById($id);
        try {
            $domain->Delete();
        } catch (DataModelException $e) {
            return $this->Finish(400, 'Bad request');
        }

        $domains = Domains::LoadAll();
        $domainsArray = [];
        foreach ($domains as $domain) {
            $domainsArray[$domain->id] = $domain->ToArray(true);
        }
        return $this->Finish(200, 'ok', $domainsArray);

    }

    /**
     * Moves a page
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @throws InvalidArgumentException
     * @return object
     */
    public function Move(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        $move = $post->{'move'};
        $domain = $post->{'domain'};
        $to = $post->{'to'};
        $sibling = $post->{'sibling'};

        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.edit')) {
            return $this->Finish(403, 'Permission denied');
        }

        $move = Pages::LoadById($move);
        if (!$move) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);
        if (!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $to = $to ? Pages::LoadById($to) : null;


        $accessPoint = $domain->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            if (!$sibling || !$to) {
                if (!$move->MoveTo($to ?: $domain)) {
                    throw new InvalidArgumentException('Bad request', 400);
                }
            } elseif ($sibling == 'before') {
                if (!$move->MoveBefore($to)) {
                    throw new InvalidArgumentException('Bad request', 400);
                }
            } elseif ($sibling == 'after') {
                if (!$move->MoveAfter($to)) {
                    throw new InvalidArgumentException('Bad request', 400);
                }
            }

        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            return $this->Finish(400, 'Bad request', ['message' => $e->getMessage(), 'code' => 400]);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application validation error', ['message' => $e->getMessage(), 'code' => 400, 'data' => $e->getExceptionDataAsArray()]);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application error', ['message' => $e->getMessage(), 'code' => 500]);
        }

        $accessPoint->Commit();

        $pages = Pages::LoadAll();
        $pagesArray = [];
        foreach ($pages as $page) {
            $pagesArray[$page->id] = $page->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pagesArray);

    }

}