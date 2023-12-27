import cron from 'node-cron';

const cronTab = [
  {
    interval: '*/5 0,1,2,3,4 * * 5',
    task: 'role-credit',
  },
];

module.exports = () => {
  console.log('Cron Initiated');
  cronTab.forEach(job => {
    cron.schedule(job.interval, () => {
      require('./' + job.task)();
    }, {
      timezone: 'America/New_York',
    });
  });
};
