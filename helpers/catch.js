const catchErr = err => {
  console.error(err);
  process.exit(1);
};
process.on('uncaughtException', catchErr);
process.on('unhandledRejection', catchErr);
