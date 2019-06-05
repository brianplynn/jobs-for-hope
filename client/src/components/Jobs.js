import React from "react";
import SearchBox from "./SearchBox";
import JobPostings from "./JobPostings";
import SideFilter from "./SideFilter";
import "./Jobs.scss";
import Modal from "./Modal";
import { dist } from "../utils/utils";
import { css } from "@emotion/core";
import { RotateLoader } from "react-spinners";
import { withRouter, Link } from "react-router-dom";
import Paginator from "./Paginator";

const override = css`
  display: block;
  margin: auto auto;
  border-color: red;
`;

class Jobs extends React.Component {
  state = {
    isBusy: false,
    search: "",
    zipSearch: "",
    jobTitle: "",
    employmentTypeFT: false,
    employmentTypePT: false,
    radius: "",
    distanceZip: "",
    filteredJobs: [],
    paginatedJobs: [],
    itemCount: 0,
    organizationId: "", // Needs to be tracked as a string, e.g. "3", for compatibility with select option values
    organizations: [],
    modalVisible: false,
    modalJob: null,
    itemsPerPage: 6,
    totalPages: 0,
    currentPage: 0
  };

  componentDidMount() {
    window.scroll(0, 0);
    const organizationId = this.props.match.params.organization_id;
    if (organizationId) {
      this.setState({ organizationId }, this.filterJobs);
    } else {
      this.filterJobs();
    }
  }

  handleChangeItemsPerPage = e => {
    this.setState(
      { itemsPerPage: parseInt(e.target.value), currentPage: 0 },
      this.paginateJobs
    );
  };

  paginateJobs = () => {
    this.setState(prevState => {
      const paginatedJobs =
        prevState.filteredJobs &&
        prevState.filteredJobs.filter((value, index) => {
          const first = prevState.currentPage * prevState.itemsPerPage;
          return index >= first && index < first + prevState.itemsPerPage;
        });
      return {
        paginatedJobs,
        totalPages: Math.ceil(
          prevState.filteredJobs.length / prevState.itemsPerPage
        )
      };
    });
  };

  goToPage = pageNumber => {
    this.setState({ currentPage: pageNumber }, this.paginateJobs);
  };

  filterJobs = () => {
    const {
      search,
      zipSearch,
      employmentTypeFT,
      employmentTypePT,
      radius,
      distanceZip,
      organizationId
    } = this.state;
    const filteredJobs = this.props.jobs
      .filter(job => {
        return (
          !organizationId || job.organization_id === Number(organizationId)
        );
      })
      .filter(job => job.zipcode.includes(zipSearch))
      .filter(job => job.title.toLowerCase().includes(search.toLowerCase()))
      .filter(this.getEmploymentTypeFilter(employmentTypeFT, employmentTypePT))
      .filter(this.getDistanceFilter(radius, distanceZip))
      // Sort by organization, position title
      .sort((a, b) => {
        if (a.organization_name < b.organization_name) {
          return -1;
        } else if (a.organization_name > b.organization_name) {
          return 1;
        } else if (a.title < b.title) {
          return -1;
        } else if (a.title > b.title) {
          return 1;
        }
        return 0;
      });
    this.setState(prevState => {
      return {
        filteredJobs,
        itemCount: filteredJobs.length,
        isBusy: false
      };
    }, this.paginateJobs);
  };

  getEmploymentTypeFilter = (employmentTypeFT, employmentTypePT) => {
    if (employmentTypeFT && !employmentTypePT) {
      return job => job.hours.includes("Full-Time");
    } else if (employmentTypePT && !employmentTypeFT) {
      return job => job.hours.includes("Part-Time");
    }
    // If both FT and PT are selected OR neither are selected,
    // show all jobs (?)
    return job => true;
  };

  getDistanceFilter = (radius, originZip) => {
    if (radius && originZip) {
      return job => {
        // dist returns null if either arg is "" or invalid
        const distance = dist(job.zipcode, originZip);
        return distance && distance <= Number(radius);
      };
    }
    return job => true;
  };

  onSearchChange = e => {
    this.setState({ search: e.target.value, isBusy: true }, this.filterJobs);
  };

  onZipSearchChange = e => {
    this.setState({ zipSearch: e.target.value, isBusy: true }, this.filterJobs);
  };

  onSetEmploymentTypeFT = checked => {
    this.setState({ employmentTypeFT: checked, isBusy: true }, this.filterJobs);
  };

  onSetEmploymentTypePT = checked => {
    this.setState({ employmentTypePT: checked, isBusy: true }, this.filterJobs);
  };

  onSetDistance = e => {
    this.setState({ radius: e.target.value, isBusy: true }, this.filterJobs);
  };

  onSetDistanceZip = e => {
    this.setState(
      { distanceZip: e.target.value, isBusy: true },
      this.filterJobs
    );
  };

  onSetOrganization = e => {
    this.setState(
      {
        organizationId: e.target.value ? Number(e.target.value) : "",
        isBusy: true
      },
      this.filterJobs
    );
  };

  onShowModal = job => {
    this.setState({
      modalVisible: true,
      modalJob: job
    });
  };

  onHideModal = () => {
    this.setState({ modalVisible: false, modalJob: null });
  };

  render() {
    const {
      paginatedJobs,
      userJobTitle,
      itemCount,
      organizationId,
      isBusy,
      totalPages,
      currentPage
    } = this.state;
    const { activeUser } = this.props;
    return (
      <div>
        <div>
          <SearchBox
            onSearchChange={this.onSearchChange}
            onZipSearchChange={this.onZipSearchChange}
            userJobTitle={userJobTitle}
            organizations={this.props.organizations}
            organizationId={organizationId}
            onSetOrganization={this.onSetOrganization}
          />
          <div className="filters-postings-wrapper">
            <SideFilter
              onSetEmploymentTypeFT={this.onSetEmploymentTypeFT}
              onSetEmploymentTypePT={this.onSetEmploymentTypePT}
              onSetDistance={this.onSetDistance}
              onSetDistanceZip={this.onSetDistanceZip}
              employmentTypeFT={this.state.employmentTypeFT}
              employmentTypePT={this.state.employmentTypePT}
              radius={this.state.radius}
              distanceZip={this.state.distanceZip}
            />
            <section role="tablist" className="recent-postings-container">
              <div className="header-container">
                <h2 className="recent-postings-title">
                  Recent Job Postings {`(${itemCount})`}
                </h2>
                {activeUser.role === "admin" ||
                activeUser.role === "employer" ? (
                  <Link to={`/jobs/form/new`} id="new-job-btn">
                    Post a Job
                  </Link>
                ) : null}
              </div>
              <div>
                <Paginator
                  totalPages={totalPages}
                  currentPage={currentPage}
                  goTo={this.goToPage}
                  buttonCount={5}
                />
              </div>
              {this.props.isPending || isBusy ? (
                <div
                  style={{
                    height: "200",
                    width: "100%",
                    margin: "100px auto",
                    display: "flex",
                    justifyContent: "space-around"
                  }}
                >
                  <RotateLoader
                    css={override}
                    sizeUnit={"px"}
                    size={15}
                    color={"#266294"}
                    loading={true}
                  />
                </div>
              ) : (
                <ul>
                  {paginatedJobs.map((job, index) => (
                    <li key={index}>
                      <JobPostings
                        job={job}
                        activeUser={this.props.activeUser}
                        onShowModal={this.onShowModal}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginBottom: "2em"
                }}
              >
                <Paginator
                  totalPages={totalPages}
                  currentPage={currentPage}
                  goTo={this.goToPage}
                  buttonCount={5}
                />
                <select
                  value={this.itemsPerPage}
                  onChange={this.handleChangeItemsPerPage}
                >
                  <option value="6">6</option>
                  <option value="12">12</option>
                  <option value="18">18</option>
                  <option value="24">24</option>
                  <option value="1024">1024</option>
                </select>
              </div>
            </section>
          </div>
          <Modal
            modalVisible={this.state.modalVisible}
            modalJob={this.state.modalJob}
            onHideModal={this.onHideModal}
            isUserCreated={this.state.isUserCreated}
          />
        </div>
      </div>
    );
  }
}

export default withRouter(Jobs);
