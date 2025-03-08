class QueryHelper {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filterAndSearch(searchField = "firstName") {
    const queryObj = { ...this.queryString };
    ["page", "sort", "limit"].forEach((el) => delete queryObj[el]);

    if (queryObj.search) {
      queryObj[searchField] = { $regex: queryObj.search, $options: "i" };
      delete queryObj.search;
    }

    this.query = this.query.find(queryObj);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("createdAt");
    }

    return this;
  }

  paginate(maxLimit = 10) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || maxLimit;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default QueryHelper;
