import cron from 'node-cron';

const cronTab = [
  {
    interval: '1-25/5 0 0 * * 5',
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
