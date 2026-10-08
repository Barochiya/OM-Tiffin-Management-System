const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Tiffin = require('../models/Tiffin');
const DailyEntry = require('../models/DailyEntry');
const { MONTHS, boundary, change, periods } = require('../utils/dashboardPeriods');
const paymentDate = { $ifNull: ['$paymentDate', '$createdAt'] };
const success = { status: 'Success' };
const sumPayments = (start, end) => Payment.aggregate([
  { $match: success }, { $addFields: { reportingDate: paymentDate } },
  ...(start ? [{ $match: { reportingDate: { $gte: start, $lt: end } } }] : []),
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);
const sumMeals = (start, end) => DailyEntry.aggregate([
  { $match: { date: { $gte: start, $lt: end } } },
  { $group: { _id: null, total: { $sum: { $add: [
    { $ifNull: ['$breakfastQty',0] }, { $ifNull: ['$lunchQty',0] }, { $ifNull: ['$dinnerQty',0] }] } } } }
]);
exports.getDashboard = async (req, res) => {
  let period;
  try { period = periods(req.query); } catch (error) { return res.status(400).json({ success:false, message:error.message }); }
  try {
    const p = period;
    const [totalCustomers, activeCustomers, recentPayments, revenue, previousRevenue, pendingBills,
      monthly, topCustomers, today, yesterday, meals, previousMeals, yearGroups] = await Promise.all([
      Tiffin.countDocuments(), Tiffin.countDocuments({ status:'Active' }),
      Payment.find().populate('customer').sort({ createdAt:-1 }).limit(5),
      sumPayments(p.start,p.end), p.start ? sumPayments(p.previousStart,p.start) : Promise.resolve([]),
      Bill.find({ pendingAmount:{ $gt:0 }, carriedForward:{ $ne:true } }).populate('customer'),
      Payment.aggregate([{ $match:success }, { $addFields:{ reportingDate:paymentDate } },
        { $match:{ reportingDate:{ $gte:boundary(p.chartYear,0), $lt:boundary(p.chartYear+1) } } },
        { $group:{ _id:{ year:{ $year:{ date:'$reportingDate', timezone:'Asia/Kolkata' } }, month:{ $month:{ date:'$reportingDate', timezone:'Asia/Kolkata' } } }, revenue:{ $sum:'$amount' } } }]),
      Payment.aggregate([{ $match:success }, { $addFields:{ reportingDate:paymentDate } },
        ...(p.start ? [{ $match:{ reportingDate:{ $gte:p.start,$lt:p.end } } }] : []),
        { $group:{ _id:'$customer',totalPaid:{ $sum:'$amount' } } },{ $sort:{ totalPaid:-1 } },{ $limit:5 },
        { $lookup:{ from:'tiffins',localField:'_id',foreignField:'_id',as:'customer' } },
        { $unwind:{ path:'$customer',preserveNullAndEmptyArrays:true } }]),
      sumPayments(p.todayStart,p.tomorrow), sumPayments(p.yesterday,p.todayStart),
      sumMeals(p.todayStart,p.tomorrow), sumMeals(p.yesterday,p.todayStart),
      Payment.aggregate([{ $match:success }, { $group:{ _id:{ $year:{ date:paymentDate,timezone:'Asia/Kolkata' } } } },{ $sort:{ _id:-1 } }])
    ]);
    const amount = rows => Number(rows[0]?.total || 0);
    const lookup = (year,month) => Number(monthly.find(row => row._id.year===year && row._id.month===month)?.revenue || 0);
    const revenueChart = MONTHS.map((month,index) => ({ month, revenue:lookup(p.chartYear,index+1),
      growth:p.chartYear>p.currentYear || (p.chartYear===p.currentYear && index+1>p.currentMonth) ? {percent:null,label:"Future month"} : change(lookup(p.chartYear,index+1),index ? lookup(p.chartYear,index) : lookup(p.chartYear-1,12),p.chartYear===p.currentYear && index+1===p.currentMonth ? "month so far vs previous month" : "vs previous month") }));
    res.json({ success:true, stats:{ totalCustomers,activeCustomers,totalRevenue:amount(revenue),
      totalPending:pendingBills.reduce((sum,bill)=>sum+Number(bill.pendingAmount||0),0) },
      period:{ year:p.year,month:p.month,label:p.label,chartYear:p.chartYear },
      availableYears:[...new Set([p.currentYear,p.chartYear,...yearGroups.map(row=>row._id)])].filter(Boolean).sort((a,b)=>b-a),
      growth:{ revenue:p.start && p.start>p.todayStart ? {percent:null,label:'Future period'} : p.start ? change(amount(revenue),amount(previousRevenue),(p.end>p.tomorrow ? 'period so far ' : '')+p.comparisonLabel) : { percent:null,label:'All-time successful collections' },
        active:{ percent:totalCustomers ? Math.round(activeCustomers/totalCustomers*1000)/10 : 0,label:'of registered customers',share:true },
        pending:{ percent:null,label:'Current balance; historical balances unavailable' },
        customers:{ percent:null,label:'Registered customers (current total)' },
        collection:change(amount(today),amount(yesterday),'today so far vs yesterday'),
        meals:change(amount(meals),amount(previousMeals),'today so far vs yesterday') },
      todayCollection:amount(today),todayMeals:amount(meals),revenueChart,recentPayments,pendingBills,topCustomers });
  } catch(error) { console.error('Dashboard Error:',error); res.status(500).json({ success:false,message:'Unable to load dashboard.' }); }
};
