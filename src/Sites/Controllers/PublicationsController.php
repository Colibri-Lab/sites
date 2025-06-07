<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Domains;
use App\Modules\Sites\Models\Pages;
use App\Modules\Sites\Models\Publications;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\ApplicationErrorException;
use Colibri\Exceptions\BadRequestException;
use Colibri\Exceptions\PermissionDeniedException;
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

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('sites.structure.pubs')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $domain = $post->{'domain'};
        if (!$domain) {
            throw new BadRequestException('Bad request', 400);
        }

        $domain = Domains::LoadById($domain);
        if (!$domain) {
            throw new BadRequestException('Bad request', 400);
        }

        $folder = $post->{'folder'};
        if ($folder) {
            $folder = Pages::LoadById($folder);
            if (!$folder) {
                throw new BadRequestException('Bad request', 400);
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
        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $domain = $post->{'domain'};
        if (!$domain) {
            throw new BadRequestException('Bad request', 400);
        }

        $domain = Domains::LoadById($domain);

        $pub = $post->{'pub'};
        if (!$pub) {
            throw new BadRequestException('Bad request', 400);
        }

        $pub = Publications::LoadById($pub);
        if (!$pub) {
            throw new BadRequestException('Bad request', 400);
        }

        $to = $post->{'to'};
        $to = $to ? Pages::LoadById($to) : null;

        $newPub = $pub->Copy($domain, $to);
        if (!$newPub) {
            throw new BadRequestException('Bad request', 400);
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

        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $pubs = $post->{'pubs'};
        if (!$pubs) {
            throw new BadRequestException('Bad request', 400);
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
        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $domain = $post->{'domain'};
        $folder = $post->{'folder'};
        $storage = $post->{'storage'};
        $data = $post->{'data'};

        if (!$storage || !$data) {
            throw new BadRequestException('Bad request', 400);
        }

        $domain = Domains::LoadById($domain);
        if (!$domain) {
            throw new BadRequestException('Bad request', 400);
        }

        $folder = $folder ? Pages::LoadById($folder) : null;
        $storage = Storages::Instance()->Load($storage);
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
            throw new BadRequestException($e->getMessage(), 400, $e);
        } catch (ValidationException $e) {
            $accessPoint1->Rollback();
            $accessPoint2->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        } catch (\Throwable $e) {
            $accessPoint1->Rollback();
            $accessPoint2->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
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
        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $domain = $post->{'domain'};
        $domain = Domains::LoadById($domain);

        $folder = $post->{'folder'};
        $storage = $post->{'storage'};
        $ids = $post->{'ids'} ? explode(',', $post->{'ids'}) : [];
        if (!$ids || !$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        $folder = $folder ? Pages::LoadById($folder) : null;
        $storage = Storages::Instance()->Load($storage);
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
            throw new BadRequestException($e->getMessage(), 400, $e);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
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
        if (!SecurityModule::Instance()->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!SecurityModule::Instance()->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $pub = $post->{'pub'};
        $before = $post->{'before'};

        if (!$pub || !$before) {
            throw new BadRequestException('Bad request', 400);
        }

        $pub = Publications::LoadById($pub);
        $before = Publications::LoadById($before);
        if (!$pub || !$before) {
            throw new BadRequestException('Bad request', 400);
        }


        $accessPoint = $pub->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            $pub->MoveBefore($before);

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

        return $this->Finish(200, 'ok', $pub->ToArray(true));

    }
}