import { pluckData } from '@polito/lib/core';
import { Survey, SurveysApi } from '@polito/student-api-client';
import { useQuery } from '@tanstack/react-query';

import { SurveyType } from '../../features/surveys/types/SurveyType';

const SURVEYS_QUERY_KEY = ['surveys'];

const useSurveysClient = (): SurveysApi => {
  return new SurveysApi();
};

// The derived hooks below pass a `select` so that they read the surveys query
// itself: refetching or updating it updates them too.
export const useGetSurveys = <T = Survey[]>(
  select?: (surveys: Survey[]) => T,
) => {
  const surveysClient = useSurveysClient();

  return useQuery({
    queryKey: SURVEYS_QUERY_KEY,
    queryFn: () => surveysClient.getSurveys().then(pluckData),
    select,
  });
};

const filterMandatoryNotCompiledSurveys = (surveys: Survey[]): Survey[] => {
  return surveys.filter(survey => survey.isMandatory && !survey.isCompiled);
};

export const useGetCpdSurveys = () =>
  useGetSurveys(filterMandatoryNotCompiledSurveys);

const filterMandatorySurveys = (surveys: Survey[]): Survey[] => {
  const s = surveys.filter(survey => survey.isMandatory);
  return s;
};

export const useGetAllCpdSurveys = () => useGetSurveys(filterMandatorySurveys);

const groupSurveysIntoTypes = (surveys: Survey[]): SurveyType[] => {
  return surveys
    .reduce((acc, survey) => {
      const categoryIndex = acc.findIndex(
        c => c.categoryId === survey.category.id && c.typeId === survey.type.id,
      );

      let category: SurveyType;

      if (categoryIndex >= 0) {
        category = acc.splice(categoryIndex, 1)[0];
      } else {
        category = {
          id: `${survey.category.id}_${survey.type.id}`,
          name: survey.type.name,
          categoryId: survey.category.id,
          typeId: survey.type.id,
          totalCount: 0,
          incompleteCount: 0,
        };
      }

      category.totalCount += 1;
      category.incompleteCount += survey.isCompiled ? 0 : 1;

      acc.push(category);

      return acc;
    }, [] as SurveyType[])
    .sort((a, b) => a.name.localeCompare(b.name));
};

const groupCpdSurveysIntoTypes = (surveys: Survey[]): SurveyType[] =>
  groupSurveysIntoTypes(filterMandatoryNotCompiledSurveys(surveys));

export const useGetSurveyCategories = () =>
  useGetSurveys(groupCpdSurveysIntoTypes);
