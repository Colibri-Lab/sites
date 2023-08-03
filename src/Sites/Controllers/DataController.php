<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Publications;
use Colibri\Data\SqlClient\QueryInfo;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\ApplicationErrorException;
use Colibri\Exceptions\BadRequestException;
use Colibri\Exceptions\PermissionDeniedException;
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $storage = $post->{'storage'};
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.list')) {
            throw new PermissionDeniedException('Permission denied', 403);
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
            throw new BadRequestException('Bad request', 400);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $storage = $post->{'storage'};
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.list')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $id = $post->{'row'};

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($id);
        if (!$datarow) {
            throw new BadRequestException('Bad request', 400);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $storage = $post->{'storage'};
        $data = (object) $post->{'data'};
        $pub = $post->{'pub'};

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . ($data->id ?? 0 ? '.edit' : '.add'))) {
            throw new PermissionDeniedException('Permission denied', 403);
        }


        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if ($data->id ?? 0) {
            $datarow = $tableClass::LoadById($data->id);
            if (!$datarow) {
                throw new BadRequestException('Bad request', 400);
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
            throw new BadRequestException($e->getMessage(), 400, $e);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
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
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.remove')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $ids = $post->{'ids'};
        if (!$ids) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if (!$tableClass::DeleteAllByIds(explode(',', $ids))) {
            throw new BadRequestException('Bad request', 400);
        }

        return $this->Finish(200, 'ok');
    }


}