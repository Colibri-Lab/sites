<?php

namespace App\Modules\Sites\Models;

# region Uses:
use App\Modules\Sites\Models\Domain;
use App\Modules\Sites\Models\Page;
use Colibri\Data\Storages\Fields\ObjectField;
use App\Modules\Sites\Models\Fields\ParametersField;
# endregion Uses;
use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\SqlClient\NonQueryInfo;

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
 * @property Page|null $parent Отцовская страница
 * @property string|null $name Наименование раздела
 * @property string|null $description Описание страницы
 * @property bool|null $published Опубликована
 * @property ObjectField|null $additional Всякое
 * @property ParametersField|null $parameters 
 * @property int|null $order Позиция в рамках parent-а
 * endregion Properties;
 */
class Page extends BaseModelDataRow {



    public function Publications(int $page = -1, $pagesize = 20): Publications
    {
        return Publications::LoadByPage($this, $page, $pagesize);
    }

    public function Children(int $page = -1, int $pagesize = 20): Pages
    {
        return Pages::LoadByParent($this, $page, $pagesize);
    }

    public function Next(): ?Page
    {
        $parent = $this->parent;
        $order = $this->order;
        $pages = Pages::LoadByFilter(1, 1, '{parent}=[[parent:integer]] and {order}>[[order:integer]]', '{order} asc', ['parent' => $parent ? $parent->id : 0, 'order' => $order]);
        if($pages->Count() > 0) {
            return $pages->First();
        }
        return null;
    }

    public function Previous(): ?Page
    {
        $parent = $this->parent;
        $order = $this->order;
        $pages = Pages::LoadByFilter(1, 1, '{parent}=[[parent:integer]] and {order}<[[order:integer]]', '{order} desc', ['page' => $parent ? $parent->id : 0, 'order' => $order]);
        if($pages->Count() > 0) {
            return $pages->First();
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

    public function MoveBefore(?Page $reference = null): bool
    {
        if(!$reference) {
            $fristPub = Pages::LoadByParent($this->parent ?: 0)->First();
            $this->order = $fristPub ? $fristPub->order / 2 : Pages::StartOrder / 2;
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

        $pubs = Pages::LoadByFilter(1, 1, '{parent}=[[parent:string]]', '{order} desc', ['parent' => $this->parent?->id ?: 0]);
        $lastPage = $pubs->First();
        if(!$lastPage) {
            $this->order = Publications::StartOrder;
        }
        else {
            $this->order = $lastPage->order + Publications::StartOrder;
        }
        $this->Save();
        return true;

    }

    private function _moveBranch() {
        $children = $this->Children();
        foreach($children as $child) {
            $child->MoveTo($this, false);
        }
    }

    public function MoveTo(Page|Domain $page, bool $moveToEnd = true): bool
    {
        if($page instanceof Domain) {
            $this->parent = 0;
            $this->domain = $page;
        }
        else {
            $this->domain = $page->domain;
            $this->parent = $page;
        }
        $this->_moveBranch();
        $this->Save();
        return $moveToEnd ? $this->MoveToEnd() : true;
    }

    public function Delete(): NonQueryInfo
    {

        // удаляем все публикации
        Publications::DeleteAllByPage($this);

        $childs = $this->Children();
        foreach($childs as $child) {
            $child->Delete();
        }
        
        return parent::Delete();    
    
    }

    public function Path(): array
    {

        if(!$this->parent) {
            return [$this];
        }
        
        $ret = [$this];
        $parent = $this->parent;
        while($parent) {
            $ret[] = $parent;
            $parent = $parent->parent;
        }
        $ret = array_reverse($ret);

        return $ret;

    }

    public function Template(): ?string
    {
        $template = $this->additional?->settings?->template;
        if($template) {
            return $template;
        }

        $parent = $this->parent;
        while($parent) {
            $template = $this->additional?->settings?->template;
            if(!$template) {
                break;
            }
            $parent = $parent->parent;
        }

        if($template) {
            return $template;
        }

        return $this->domain->additional?->settings?->template;

    }


}