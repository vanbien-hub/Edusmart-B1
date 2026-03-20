import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../core/provider';
import { Class, Announcement, User, Assignment } from '../../core/types';
import { Users, BookOpen, FileText, GraduationCap } from 'lucide-react';

export function AdminDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const cls = await dataProvider.getClasses();
      setClasses(cls);
      
      const users = await dataProvider.getUsers();
      setStudents(users.filter(u => u.role === 'student'));
      
      // Load all assignments and filter upcoming
      const assigns = await dataProvider.getAssignments();
      const upcoming = assigns.filter(a => new Date(a.dueDate) > new Date());
      setAssignments(upcoming);

      const anns = await dataProvider.getAnnouncements();
      setAnnouncements(anns.slice(0, 5)); // Show top 5 recent
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng số lớp học</dt>
                  <dd className="text-lg font-medium text-gray-900">{classes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng số học sinh</dt>
                  <dd className="text-lg font-medium text-gray-900">{students.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Bài tập sắp đến hạn</dt>
                  <dd className="text-lg font-medium text-gray-900">{assignments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Thông báo gần đây</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {announcements.map((ann) => (
            <li key={ann.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-600 truncate">{ann.title}</p>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Mới
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    {ann.content}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <p>
                    {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {announcements.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">
              Không có thông báo nào.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
