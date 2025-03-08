import Application from "../models/application-model.js";
import Project from "../models/project-model.js";
import Task from "../models/task-model.js";

const formatData = (data, keyName) => {
  return data.map((item) => ({
    [keyName]: item._id,
    count: item.count,
  }));
};

const analyticsCtrl = {}

analyticsCtrl.getAdminAnalytics = async (req, res) => {
  const now = new Date();

  const [applicationStats, roleWiseApplications, approvalRate] = await Promise.all([
    Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Application.aggregate([{ $group: { _id: "$requestedRole", count: { $sum: 1 } } }]),
    Application.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, approvalRate: { $multiply: [{ $divide: ["$approved", "$total"] }, 100] } } },
    ]),
  ]);

  const [projectStats, totalRevenue, yearlyRevenue, lastMonthRevenue, avgCompletionTime] = await Promise.all([
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Project.aggregate([{ $match: { isPaid: true, status: "completed" } }, { $group: { _id: null, totalRevenue: { $sum: "$budget" } } }]),
    Project.aggregate([
      {
        $match: {
          isPaid: true,
          completedDate: { $gte: { $dateTrunc: { date: now, unit: "year" } } },
        },
      },
      { $group: { _id: null, yearlyRevenue: { $sum: "$budget" } } },
    ]),
    Project.aggregate([
      {
        $match: {
          isPaid: true,
          completedDate: { $gte: { $dateTrunc: { date: now, unit: "month", binSize: 1 } } },
        },
      },
      { $group: { _id: null, lastMonthRevenue: { $sum: "$budget" } } },
    ]),
    Project.aggregate([
      { $match: { status: "completed", completedDate: { $exists: true } } },
      { $project: { duration: { $divide: [{ $subtract: ["$completedDate", "$createdAt"] }, 86400000] } } },
      { $group: { _id: null, avgDays: { $avg: "$duration" } } },
    ]),
  ]);

  const [taskStats, associateTasks, priorityStats] = await Promise.all([
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$associate", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
  ]);

  res.status(200).json({
      applications: {
        statusCounts: formatData(applicationStats, "status"),
        roleWiseCounts: formatData(roleWiseApplications, "role"),
        approvalRate: approvalRate[0]?.approvalRate || 0,
      },
      projects: {
        statusCounts: formatData(projectStats, "status"),
        totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        yearlyRevenue: yearlyRevenue[0]?.yearlyRevenue || 0,
        lastMonthRevenue: lastMonthRevenue[0]?.lastMonthRevenue || 0,
        avgCompletionDays: avgCompletionTime[0]?.avgDays || 0,
      },
      tasks: {
        statusCounts: formatData(taskStats, "status"),
        associateTaskCounts: formatData(associateTasks, "associateId"),
        priorityCounts: formatData(priorityStats, "priority"),
      },
    }
  );
};




export default analyticsCtrl