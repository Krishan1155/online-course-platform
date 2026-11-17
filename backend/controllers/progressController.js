import asyncHandler from 'express-async-handler';
import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';

/* Helper function 
  Recalculate progress using the ACTUAL lessons
  currently present in the database.
*/
const recalculateProgress = async (userId, courseId) => {
  // Get all current lessons of this course
  const lessons = await Lesson.find({course: courseId}).select('_id');

  // Create a Set containing current lesson IDs
  const lessonIds = new Set(lessons.map((lesson) => lesson._id.toString()));

  let progress = await Progress.findOne({
    user: userId,
    course: courseId,
  });

  // If progress does not exist, create it
  if (!progress) 
  {
    progress = await Progress.create({
      user: userId,
      course: courseId,
      completedLessons: [],
      progressPercentage: 0,
    });
    return progress;
  }


    // Keep only completed lesson IDs that still exist in the course.
    // This also protects us if an admin deletes a lesson.

  const validCompletedLessons =
    progress.completedLessons.filter((lessonId) => lessonIds.has(lessonId.toString())
    );

  progress.completedLessons = validCompletedLessons;

  const totalLessons = lessons.length;
  const completedLessons = validCompletedLessons.length;

  if (totalLessons === 0) 
  {
    progress.progressPercentage = 0;
  } 
  else 
  {
    progress.progressPercentage = Math.round((completedLessons / totalLessons) * 100);
  }

  await progress.save();

  return progress;
};


// --->  Mark a lesson as completed

export const markLessonComplete = asyncHandler(
  async (req, res) => {
    const { courseId, lessonId } = req.params;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!enrollment) 
    {
      res.status(403);
      throw new Error('You are not enrolled in this course');
    }

    // Check lesson
    const lesson = await Lesson.findById(lessonId);

    if(!lesson || lesson.course.toString() !== courseId.toString()) 
    {
      res.status(404);
      throw new Error('Lesson not found in this course');
    }

    // Get progress
    let progress = await Progress.findOne({
      user: req.user._id,
      course: courseId,
    });

    // Create progress if it doesn't exist
    if (!progress) 
    {
      progress = await Progress.create({
        user: req.user._id,
        course: courseId,
        completedLessons: [],
        progressPercentage: 0,
      });
    }

    // Check whether the lesson is already completed   
    const alreadyCompleted =
      progress.completedLessons.some(
        (id) => id.toString() === lessonId.toString()
      );

    //Add the lesson if it is not completed
    if (!alreadyCompleted) 
    {
      progress.completedLessons.push(lessonId);
    }

    // Update last accessed lesson
    progress.lastAccessedLesson = lessonId;

    await progress.save();

    
    //  Recalculate using the actual number of lessons
    //  currently present in the database.
    
    progress = await recalculateProgress(
      req.user._id,
      courseId
    );

    
    //  Update enrollment status.

    // If 100% -> completed
    //  Otherwise -> active
    if (progress.progressPercentage >= 100) 
    {
      await Enrollment.findByIdAndUpdate(
        enrollment._id,
        { status: 'completed' }
      );
    } 
    else if (enrollment.status === 'completed') 
    {
      await Enrollment.findByIdAndUpdate(
        enrollment._id,
        { status: 'active' }
      );
    }

    res.json({
      success: true,
      data: progress,
    });
  }
);


 // ---> Get progress of current user for a course

export const getProgress = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;
    const { lessonId } = req.query;

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!enrollment) 
    {
      res.status(403);
      throw new Error('You are not enrolled in this course');
    }

    const progress = await recalculateProgress(
      req.user._id,
      courseId
    );

   let lastPlaybackPosition = 0;

  if(lessonId) {
  const lesson = await Lesson.findOne({
    _id: lessonId,
    course: courseId,
  });

  if(!lesson) 
  {
    res.status(404);
    throw new Error('Lesson not found');
  }

  progress.playbackPositions ||= [];

  const savedPosition = progress.playbackPositions.find(
  (item) => item.lesson?.toString() === lessonId.toString()
);

  lastPlaybackPosition = savedPosition?.currentTime || 0;
}

    await progress.populate(
      'completedLessons',
      'title order'
    );

    res.json({
      success: true,
      data: {
        ...progress.toObject(),
        lastPlaybackPosition,
      },
    });
  }
);



// --->Update the last lesson accessed by the student

export const updateLastAccessed = asyncHandler(
  async (req, res) => {
    const { courseId, lessonId } = req.params;

  const enrollment = await Enrollment.findOne({
  user: req.user._id,
  course: courseId,
});

if (!enrollment) {
  res.status(403);
  throw new Error('You are not enrolled in this course');
}

  const lesson = await Lesson.findOne({
  _id: lessonId,
  course: courseId,
});

    if (!lesson) 
  {
     res.status(404);
     throw new Error('Lesson not found in this course');
  }

    let progress = await Progress.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!progress) 
    {
      progress = await Progress.create({
        user: req.user._id,
        course: courseId,
        completedLessons: [],
        progressPercentage: 0,
        lastAccessedLesson: lessonId,
      });
    } 
    else 
    {
      //Update last accessed lesson
      progress.lastAccessedLesson = lessonId;

    
      // Recalculate here as well.
      // This means opening a course after an admin adds lessons will also correct the percentage.
      const lessons = await Lesson.find({
        course: courseId,
      }).select('_id');

      const lessonIds = new Set(
        lessons.map((lesson) =>
          lesson._id.toString()
        )
      );


      //Remove deleted lessons from completedLessons
      progress.completedLessons =
        progress.completedLessons.filter((id) =>
          lessonIds.has(id.toString())
        );

      progress.progressPercentage =
        lessons.length > 0 ? Math.round((progress.completedLessons.length / lessons.length) *100)
          : 0;

      await progress.save();
    }

    res.json({
      success: true,
      data: progress,
    });
  }
);


// ---> Save video playback position

export const savePlaybackPosition = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { currentTime } = req.body;

  if (typeof currentTime !== 'number' || !Number.isFinite(currentTime) || currentTime < 0) 
  {
    res.status(400);
    throw new Error('Invalid playback position');
  }

  const enrollment = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (!enrollment) 
  {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }

  const lesson = await Lesson.findOne({
    _id: lessonId,
    course: courseId,
  });

  if (!lesson) 
  {
    res.status(404);
    throw new Error('Lesson not found');
  }

  let progress = await Progress.findOne({
    user: req.user._id,
    course: courseId,
  });

  if (!progress) 
  {
    progress = new Progress({
      user: req.user._id,
      course: courseId,
    });
  }

  const existingPosition = progress.playbackPositions.find(
    (item) => item.lesson.toString() === lessonId
  );

  if (existingPosition) 
  {
    existingPosition.currentTime = currentTime;
  } 
  else 
  {
    progress.playbackPositions.push({
      lesson: lessonId,
      currentTime,
    });
  }

  progress.lastAccessedLesson = lessonId;

  await progress.save();

  res.status(200).json({
    success: true,
    data: {
      lessonId,
      currentTime,
    },
  });
});