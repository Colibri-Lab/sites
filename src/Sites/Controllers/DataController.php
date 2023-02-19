<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Publications;
use Colibri\Data\SqlClient\QueryInfo;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\ValidationException;
use Colibri\Web\Controller as WebController;
use Colibri\Web\RequestCollection;
use InvalidArgumentException;

/**
 * Data controller
 */
class DataController extends WebController
{

    /**
     * Returns a list of rows
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

        $storage = $post->{'storage'};
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.list')) {
            return $this->Finish(403, 'Permission denied');
        }

        $term = $post->{'term'};
        $sortField = $post->{'sortfield'};
        $sortOrder = $post->{'sortorder'};
        $page = (int) $post->{'page'} ?: 1;
        $pagesize = (int) $post->{'pagesize'} ?: 20;

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $filters = [];
        foreach ($storage->fields as $field) {
            if ($field->class === 'string') {
                $filters[] = '{' . $field->name . '} like [[term:string]]';
            }
        }

        if (!$sortField) {
            $sortField = '{datecreated}';
        } else {
            $sortField = '{' . $sortField . '}';
        }
        if (!$sortOrder) {
            $sortOrder = 'asc';
        }

        if (!empty($filters)) {
            $datarows = $tableClass::LoadByFilter($page, $pagesize, implode(' or ', $filters), $sortField . ' ' . $sortOrder, ['term' => '%' . $term . '%']);
        } else {
            $datarows = $tableClass::LoadByFilter($page, $pagesize, '', $sortField . ' ' . $sortOrder);
        }
        if (!$datarows) {
            return $this->Finish(400, 'Bad request');
        }

        $dataArray = [];
        foreach ($datarows as $datarow) {
            $dataArray[] = $datarow->ToArray(true);
        }
        return $this->Finish(200, 'ok', $dataArray);


    }

    /**
     * Returns a row full data
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Row(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->{'storage'};
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.list')) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->{'row'};

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($id);
        if (!$datarow) {
            return $this->Finish(400, 'Bad request');
        }

        return $this->Finish(200, 'ok', $datarow->ToArray(true));

    }

    /**
     * Saves a row data
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

        $storage = $post->{'storage'};
        $data = (object) $post->{'data'};
        $pub = $post->{'pub'};

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . ($data->id ?? 0 ? '.edit' : '.add'))) {
            return $this->Finish(403, 'Permission denied');
        }


        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if ($data->id ?? 0) {
            $datarow = $tableClass::LoadById($data->id);
            if (!$datarow) {
                return $this->Finish(400, 'Bad request');
            }
        } else {
            $datarow = $tableClass::LoadEmpty();
        }

        foreach ($data as $key => $value) {
            $datarow->$key = $value;
        }

        $accessPoint = $datarow->Storage()->accessPoint;
        $accessPoint->Begin();

        try {
            /** @var QueryInfo $res */
            if (($res = $datarow->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

            if ($pub) {
                $pub = Publications::LoadById($pub);
                if (($res = $pub->Save(true)) !== true) {
                    throw new InvalidArgumentException($res->error, 400);
                }
                $pub = $pub->ToArray(true);
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

        return $this->Finish(200, 'ok', ['datarow' => $datarow->ToArray(true), 'pub' => $pub]);

    }

    /**
     * Deletes a row
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

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            return $this->Finish(400, 'Bad request');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $ids = $post->{'ids'};
        if (!$ids) {
            return $this->Finish(400, 'Bad request');
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if (!$tableClass::DeleteAllByIds(explode(',', $ids))) {
            return $this->Finish(400, 'Bad request');
        }

        return $this->Finish(200, 'ok');
    }


}