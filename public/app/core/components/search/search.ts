import _ from 'lodash';
import coreModule from '../../core_module';
import { SearchSrv } from 'app/core/services/search_srv';

export class SearchCtrl {
  isOpen: boolean;
  query: any;
  giveSearchFocus: number;
  selectedIndex: number;
  results: any;
  currentSearchId: number;
  showImport: boolean;
  dismiss: any;
  ignoreClose: any;
  isLoading: boolean;
  initialFolderFilterTitle: string;

  /** @ngInject */
  constructor($scope, private $location, private $timeout, private searchSrv: SearchSrv, $rootScope) {
    $rootScope.onAppEvent('show-dash-search', this.openSearch.bind(this), $scope);
    $rootScope.onAppEvent('hide-dash-search', this.closeSearch.bind(this), $scope);

    this.initialFolderFilterTitle = "All";
  }

  closeSearch() {
    this.isOpen = this.ignoreClose;
  }

  openSearch(evt, payload) {
    if (this.isOpen) {
      this.closeSearch();
      return;
    }

    this.isOpen = true;
    this.giveSearchFocus = 0;
    this.selectedIndex = -1;
    this.results = [];
    this.query = { query: '', tag: [], starred: false };
    this.currentSearchId = 0;
    this.ignoreClose = true;
    this.isLoading = true;

    if (payload && payload.starred) {
      this.query.starred = true;
    }

    this.$timeout(() => {
      this.ignoreClose = false;
      this.giveSearchFocus = this.giveSearchFocus + 1;
      this.search();
    }, 100);
  }

  keyDown(evt) {
    if (evt.keyCode === 27) {
      this.closeSearch();
    }
    if (evt.keyCode === 40) {
      this.moveSelection(1);
    }
    if (evt.keyCode === 38) {
      this.moveSelection(-1);
    }
    if (evt.keyCode === 13) {
      var selectedDash = this.results[this.selectedIndex];
      if (selectedDash) {
        this.$location.search({});
        this.$location.path(selectedDash.url);
      }
    }
  }

  moveSelection(direction) {
    var max = (this.results || []).length;
    var newIndex = this.selectedIndex + direction;
    this.selectedIndex = ((newIndex %= max) < 0) ? newIndex + max : newIndex;
  }

  searchDashboards() {
    this.currentSearchId = this.currentSearchId + 1;
    var localSearchId = this.currentSearchId;

    return this.searchSrv.search(this.query).then(results => {
      if (localSearchId < this.currentSearchId) { return; }
      this.results = results;
      this.isLoading = false;
    });
  }

  queryHasNoFilters() {
    var query = this.query;
    return query.query === '' && query.starred === false && query.tag.length === 0;
  }

  filterByTag(tag, evt) {
    this.query.tag.push(tag);
    this.search();
    this.giveSearchFocus = this.giveSearchFocus + 1;
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
  }

  removeTag(tag, evt) {
    this.query.tag = _.without(this.query.tag, tag);
    this.search();
    this.giveSearchFocus = this.giveSearchFocus + 1;
    evt.stopPropagation();
    evt.preventDefault();
  }

  getTags() {
    return this.searchSrv.getDashboardTags().then((results) => {
      this.results = results;
      this.giveSearchFocus = this.giveSearchFocus + 1;
    });
  }

  showStarred() {
    this.query.starred = !this.query.starred;
    this.giveSearchFocus = this.giveSearchFocus + 1;
    this.search();
  }

  search() {
    this.showImport = false;
    this.selectedIndex = 0;
    this.searchDashboards();
  }

  toggleFolder(section) {
    this.searchSrv.toggleSection(section);
  }
}

export function searchDirective() {
  return {
    restrict: 'E',
    templateUrl: 'public/app/core/components/search/search.html',
    controller: SearchCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {},
  };
}

coreModule.directive('dashboardSearch', searchDirective);
