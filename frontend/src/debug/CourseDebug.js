import React, { useState, useEffect } from 'react';
import courseService from '../services/courseService';

const CourseDebug = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        console.log('Fetching courses for debug...');
        
        const [allCoursesResponse, enrolledResponse] = await Promise.all([
          courseService.getAllCourses(),
          courseService.getEnrolledCourses()
        ]);
        
        console.log('Raw all courses response:', allCoursesResponse);
        console.log('Raw enrolled courses response:', enrolledResponse);
        
        setRawData({
          allCourses: allCoursesResponse,
          enrolledCourses: enrolledResponse
        });
        
        setCourses(Array.isArray(allCoursesResponse) ? allCoursesResponse : []);
        setEnrolledCourses(Array.isArray(enrolledResponse) ? enrolledResponse : []);
      } catch (error) {
        console.error('Debug fetch error:', error);
      }
    };

    fetchDebugData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Course Debug Information</h2>
      
      <h3>All Courses ({courses.length} items)</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(courses, null, 2)}
      </pre>
      
      <h3>Enrolled Courses ({enrolledCourses.length} items)</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(enrolledCourses, null, 2)}
      </pre>
      
      <h3>Raw API Responses</h3>
      <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(rawData, null, 2)}
      </pre>
      
      <h3>Course IDs Analysis</h3>
      <div style={{ background: '#e6f3ff', padding: '10px' }}>
        <h4>All Course IDs:</h4>
        {courses.map((course, index) => (
          <div key={index}>
            Course {index + 1}: id={course.id}, _id={course._id}, title="{course.title}"
          </div>
        ))}
        
        <h4>Enrolled Course IDs:</h4>
        {enrolledCourses.map((course, index) => (
          <div key={index}>
            Enrolled {index + 1}: id={course.id}, _id={course._id}, title="{course.title}"
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseDebug;