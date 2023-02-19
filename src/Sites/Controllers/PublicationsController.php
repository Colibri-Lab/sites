<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Domains;
use App\Modules\Sites\Models\Pages;
use App\Modules\Sites\Models\Publications;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\ValidationException;
use Colibri\Web\Controller as WebController;
use Colibri\Web\RequestCollection;
use InvalidArgumentException;

/**
 * Publications controller
 */
class PublicationsController extends WebController
{
    /**
     * Returns a list of publications in given domain or page
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

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->{'domain'};
        if (!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);
        if (!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $folder = $post->{'folder'};
        if ($folder) {
            $folder = Pages::LoadById($folder);
            if (!$folder) {
                return $this->Finish(400, 'Bad request');
            }
        } else {
            $folder = 0;
        }

        $term = $post->{'term'};
        $page = (int) $post->{'page'} ?: 1;
        $pagesize = (int) $post->{'pagesize'} ?: 20;

        $pubs = Publications::LoadByPage($domain, $folder, $term, $page, $pagesize);
        $pubsArray = [];
        foreach ($pubs as $pub) {
            $pubsArray[] = $pub->ToArray(true);
        }
        return $this->Finish(200, 'ok', $pubsArray);
    }

    /**
     * Copies a publication
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Copy(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->{'domain'};
        if (!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);

        $pub = $post->{'pub'};
        if (!$pub) {
            return $this->Finish(400, 'Bad request');
        }

        $pub = Publications::LoadById($pub);
        if (!$pub) {
            return $this->Finish(400, 'Bad request');
        }

        $to = $post->{'to'};
        $to = $to ? Pages::LoadById($to) : null;

        $newPub = $pub->Copy($domain, $to);
        if (!$newPub) {
            return $this->Finish(400, 'Bad request');
        }
        $newPub->Save();

        return $this->Finish(200, 'ok', $newPub->ToArray(true));

    }

    /**
     * Deletes a publication
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

        $pubs = $post->{'pubs'};
        if (!$pubs) {
            return $this->Finish(400, 'Bad request');
        }

        Publications::DeleteAllByIds(explode(',', $pubs));

        return $this->Finish(200, 'ok');
    }

    /**
     * Creates a publication
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @throws InvalidArgumentException
     * @return object
     */
    public function Create(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->{'domain'};
        $folder = $post->{'folder'};
        $storage = $post->{'storage'};
        $data = $post->{'data'};

        if (!$storage || !$data) {
            return $this->Finish(400, 'Bad request');
        }

        $domain = Domains::LoadById($domain);
        if (!$domain) {
            return $this->Finish(400, 'Bad request');
        }

        $folder = $folder ? Pages::LoadById($folder) : null;
        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadEmpty();


        $accessPoint1 = $domain->Storage()->accessPoint;
        $accessPoint1->Begin();

        $accessPoint2 = $datarow->Storage()->accessPoint;
        $accessPoint2->Begin();

        try {
            foreach ($data as $field => $value) {
                $datarow->$field = $value;
            }
            if (($res = $datarow->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

            $newPub = Publications::CreatePublication($domain, $folder, $datarow);
            if (($res = $newPub->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

        } catch (InvalidArgumentException $e) {
            $accessPoint1->Rollback();
            $accessPoint2->Rollback();
            return $this->Finish(400, 'Bad request', ['message' => $e->getMessage(), 'code' => 400]);
        } catch (ValidationException $e) {
            $accessPoint1->Rollback();
            $accessPoint2->Rollback();
            return $this->Finish(500, 'Application validation error', ['message' => $e->getMessage(), 'code' => 400, 'data' => $e->getExceptionDataAsArray()]);
        } catch (\Throwable $e) {
            $accessPoint1->Rollback();
            $accessPoint2->Rollback();
            return $this->Finish(500, 'Application error', ['message' => $e->getMessage(), 'code' => 500]);
        }

        $accessPoint1->Commit();
        $accessPoint2->Commit();

        return $this->Finish(200, 'ok', $newPub->ToArray(true));

    }

    /**
     * Publishes data from given storage
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @throws InvalidArgumentException
     * @return object
     */
    public function Publish(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $domain = $post->{'domain'};
        $domain = Domains::LoadById($domain);

        $folder = $post->{'folder'};
        $storage = $post->{'storage'};
        $ids = $post->{'ids'} ? explode(',', $post->{'ids'}) : [];
        if (!$ids || !$storage) {
            return $this->Finish(400, 'Bad request');
        }

        $folder = $folder ? Pages::LoadById($folder) : null;
        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $accessPoint = $domain->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            $pubArray = [];
            foreach ($ids as $id) {

                $datarow = $tableClass::LoadById($id);
                if (!$datarow) {
                    continue;
                }

                $pub = Publications::CreatePublication($domain, $folder, $datarow);
                if (($res = $pub->Save(true)) !== true) {
                    throw new InvalidArgumentException($res->error, 400);
                }
                $pubArray[] = $pub->ToArray(true);

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

        return $this->Finish(200, 'ok', $pubArray);

    }

    /**
     * Moves a publication
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Move(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            return $this->Finish(403, 'Permission denied');
        }

        $pub = $post->{'pub'};
        $before = $post->{'before'};

        if (!$pub || !$before) {
            return $this->Finish(400, 'Bad request');
        }

        $pub = Publications::LoadById($pub);
        $before = Publications::LoadById($before);
        if (!$pub || !$before) {
            return $this->Finish(400, 'Bad request');
        }


        $accessPoint = $pub->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            $pub->MoveBefore($before);

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

        return $this->Finish(200, 'ok', $pub->ToArray(true));

    }
}