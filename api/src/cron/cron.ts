import cron from 'node-cron';

const cronTab = [
  {
    interval: '* 0-10/1 0 * * 5',
    task: 'role-credit',
  },
];

module.exports = () => {
  console.log('Cron Initiated');
  cronTab.forEach(job => {
    cron.schedule(job.interval, () => {
      require('./' + job.task)();
    });
  });
};
