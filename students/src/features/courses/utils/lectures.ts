import {
  VirtualClassroomLive,
  VirtualClassroomRecording,
  instanceOfVirtualClassroomLive,
  instanceOfVirtualClassroomRecording,
} from '@polito/student-api-client';

import { CourseLecture } from '../types/CourseLectureSections';

export const isLiveVC = (l: CourseLecture): l is VirtualClassroomLive =>
  instanceOfVirtualClassroomLive(l);

export const isRecordedVC = (
  l: CourseLecture,
): l is VirtualClassroomRecording => instanceOfVirtualClassroomRecording(l);
