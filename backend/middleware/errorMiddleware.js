const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode; //default response status is usually 200.
  let message = err.message;


  //Mongoose can throw a CastError when 
  //it cannot convert a supplied value into the expected schema type.
  if (err.name === 'CastError') 
  {
    statusCode = 404;
    message = 'Resource not found';
  }


  //handles MongoDB duplicate-key errors
  if (err.code === 11000) 
  {   
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  if (err.name === 'ValidationError') 
  {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export { notFound, errorHandler };
