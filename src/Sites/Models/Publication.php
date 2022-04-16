<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use App\Modules\Sites\Models\Page;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Fields\ObjectField;
use Colibri\Data\Storages\Storages;

/**
 * Представление строки в таблице в хранилище Публикации
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property Domain|null $domain Домен
 * @property Page|null $page Страница
 * @property string|null $storage Хранилище материалов
 * @property int|null $row ID записи в хранилище
 * @property string|null $ft Полнотекстовый поиск
 * @property ObjectField|null $object Данные строки
 * @property int|null $order Позиция в рамках страницы
 * endregion Properties;
 */
class Publication extends BaseModelDataRow {

    public function Next(): ?Publication
    {
        $page = $this->page;
        $order = $this->order;
        $pubs = Publications::LoadByFilter(1, 1, '{page}=[[page:integer]] and {order}>[[order:integer]]', '{order} asc', ['page' => $page->id, 'order' => $order]);
        if($pubs->Count() > 0) {
            return $pubs->First();
        }
        return null;
    }

    public function Previous(): ?Publication
    {
        $page = $this->page;
        $order = $this->order;
        $pubs = Publications::LoadByFilter(1, 1, '{page}=[[page:integer]] and {order}<[[order:integer]]', '{order} desc', ['page' => $page->id, 'order' => $order]);
        if($pubs->Count() > 0) {
            return $pubs->First();
        }
        return null;
    }

    public function MoveUp(): bool
    {

        $prev = $this->Previous();
        if(!$prev) {
            return false;
        }

        $prevOrder = $prev->order;
        $thisOrder = $this->order;
        $prev->order = $thisOrder;
        $this->order = $prevOrder;
        
        $this->Save();
        $prev->Save();

        return true;

    }

    public function MoveDown(): bool
    {
        
        $next = $this->Next();
        if(!$next) {
            return false;
        }

        $nextOrder = $next->order;
        $thisOrder = $this->order;
        $next->order = $thisOrder;
        $this->order = $nextOrder;
        
        $this->Save();
        $next->Save();
        
        return true;
    }

    public function MoveBefore(?Publication $reference = null): bool
    {
        if(!$reference) {
            $fristPub = Publications::LoadByPage($this->page)->First();
            $this->order = $fristPub ? $fristPub->order / 2 : Publications::StartOrder / 2;
        }
        else {
            $referencePrev = $reference->Previous();
            $this->order = (($referencePrev ? $referencePrev->order : 0) + $reference->order) / 2;
        }
        $this->Save();
        return true;
    }

    public function MoveToStart(): bool
    {
        return $this->MoveBefore(null);
    }

    public function MoveToEnd(): bool
    {

        $pubs = Publications::LoadByFilter(1, 1, '{page}=[[page:string]]', '{order} desc', ['page' => $this->page->id]);
        $lastPub = $pubs->First();
        if(!$lastPub) {
            $this->order = Publications::StartOrder;
        }
        else {
            $this->order = $lastPub->order + Publications::StartOrder;
        }
        $this->Save();
        return true;

    }

    public function DataRow(): mixed
    {
        $storage = Storages::Create()->Load($this->storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        return $tableClass::LoadById($this->row);
    }

    public function Copy(?Page $to = null): ?Publication
    {
        $datarow = $this->DataRow();
        if(!$datarow) {
            return null;
        }
        return Publications::CreatePublication($to, $datarow);
    }

    public function Save(): bool
    {
        $datarow = $this->DataRow();
        $this->ft = $datarow->ToString();
        $this->object = json_encode($datarow);
        return parent::Save();
    }

}