import {
  parseAttributes,
  parseLimit,
  parseOffset,
  parseOrder,
  parseWhere,
} from "@/libraries/ModelController";
import { colors, getRandomColor, months, numToMonth } from "@/libraries/util";
import chai from "chai";
import { parseBody, parseId } from "@/libraries/BaseController";
import { Request } from "express";
/*
TESTING API
*/

describe("Test framework app unit test", () => {
  const request: Partial<Request> = {
    body: {
      address: "TestNoffftification@c.com",
      birthdate: "2020-08-01T15:01:11-05:00",
      appraisalBody: {
        grossSalary: 200,
        currencyId: 3,
      },
      benefitsPackageId: 1,
      departmentId: 10,
      emergencyContact: "TestNotification",
      emergencyNumber: "9999999999",
      extraBenefits: [],
      filesId: [],
      firstName: "TestAlex",
      hiringDate: "2022-02-09T15:01:00-06:00",
      isDepartmentManager: false,
      jobEmail: "t@test.com",
      personalEmail: "t@wASdfsfs.com",
      positionId: 1,
      lastName: "TestAlex",
      managerId: 448,
      middleName: "TestAlex",
      nationalIdentificationNumber: "TestNotification",
      phone: "9999999999",
      profileImageId: null,
      projects: [],
      regionId: 3,
      roleId: [2, 3],
      secondLastName: "TestAlex",
      socialSecurityNumber: "TestNotification",
      status: "active",
      taxIdentificationNumber: "TestNotification",
      terminationDate: "",
      workingHours: 8,
    },
    params: {
      id: "24",
    },
    query: {
      where: {
        lastName: "TestAlex",
      },
      limit: "2",
      order: {
        name: "1",
      },
      offset: "3",
      attributes: ["roleId", "status", "positionId", "extraBenefits"],
    },
  };

  describe("#parseBody()", function() {
    const parseBodyFunc = parseBody(request);
    it("should be destructure property body", function() {
      const { body } = request;
      chai.expect(parseBodyFunc).to.be.equal(body);
    });

    it("should be an object type", function() {
      chai.expect(parseBodyFunc).to.be.an("object");
    });
  });

  describe("#parseId", () => {
    const parseIdFunc = parseId(request);
    it("should be destructure id property", () => {
      chai.expect(parseIdFunc).to.be.equal(24);
    });

    it("should be a number type", () => {
      chai.expect(parseIdFunc).to.be.an("number");
    });
  });

  describe("#parseWhere", () => {
    const parseWhereFunc = parseWhere(request);
    it("should be destructure the property where", () => {
      chai.expect(parseWhereFunc).to.be.equal(request.query.where);
    });

    it("should be a object type", () => {
      chai.expect(parseWhereFunc).to.be.an("object");
    });
  });

  describe("#parseLimit", () => {
    const parseLimitFunc = parseLimit(request);
    it("should be destructure the property limit of 2", () => {
      chai.expect(parseLimitFunc).to.be.equal(Number(request.query.limit));
    });

    it("should be a number type", () => {
      chai.expect(parseLimitFunc).to.be.an("number");
    });
  });

  describe("#parseOffset", () => {
    const parseOffsetFunc = parseOffset(request);
    it("should be destructure the property limit of 3", () => {
      chai.expect(parseOffsetFunc).to.be.equal(Number(request.query.offset));
    });

    it("should be a number type", () => {
      chai.expect(parseOffsetFunc).to.be.an("number");
    });
  });

  describe("#parseOrder", () => {
    const parseOrderFunc = parseOrder(request);
    it("should be destructure the property order", () => {
      chai.expect(parseOrderFunc).to.be.equal(request.query.order);
    });

    it("should be a object type", () => {
      chai.expect(parseOrderFunc).to.be.an("object");
    });
  });

  describe("#parseAttributes", () => {
    const parseAttributesFunc = parseAttributes(request);
    it("should be destructure the property attributes", () => {
      chai
        .expect(parseAttributesFunc)
        .to.be.deep.equal(request.query.attributes);
    });

    it("should be a object type", () => {
      chai.expect(parseAttributesFunc).to.be.an("array");
    });
  });

  describe("#numToMonth", () => {
    const numToMonthFunc = numToMonth(1);
    const month = months[0].name;
    it(`should be equal to ${month} month`, () => {
      chai.expect(numToMonthFunc).to.be.equal(month);
    });

    it("should be a string type", () => {
      chai.expect(numToMonthFunc).to.be.an("string");
    });
  });

  describe("#getRandomColor", () => {
    const getRandomColorFunc = getRandomColor();
    it("should be get a random color", () => {
      chai.expect(getRandomColorFunc).oneOf(colors)
    });

    it("should be a number type", () => {
      chai.expect(getRandomColorFunc).to.be.an("string");
    });
  });
});
