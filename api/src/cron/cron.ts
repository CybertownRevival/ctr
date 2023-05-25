import cron from 'node-cron';

const cronTab = [
  {
    interval: '* * * * *',
    task: 'role-income',
  },
];

module.exports = () => {
  console.log('Cron Initiated');
  cronTab.forEach(job => {
    cron.schedule(job.interval, () => {
      console.log('running ' + job.task);
      require('./' + job.task)();
    });
  });
};
